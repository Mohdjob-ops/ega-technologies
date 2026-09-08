import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ADMIN_REQUIRED_SECONDS = 8 * 60 * 60;
const E8_REQUIRED_SECONDS = 4 * 60 * 60;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function ethiopiaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Addis_Ababa",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
function cleanPhone(value: unknown) {
  let phone = String(value || "").replace(/\D/g, "");

  if (phone.startsWith("251") && phone.length === 12) {
    phone = "0" + phone.slice(3);
  }

  return phone;
}

type ServiceIdentity = {
  personType: "admin" | "e8";
  personId: string;
  requiredSeconds: number;
};

async function identifyPerson(
  req: Request,
  supabase: any,
  body: any
): Promise<ServiceIdentity | null> {
  const authHeader = req.headers.get("Authorization") || "";

  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);

    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (user?.id) {
      const { data: admin } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("active", true)
        .maybeSingle();

      if (admin) {
        return {
          personType: "admin",
          personId: user.id,
          requiredSeconds: ADMIN_REQUIRED_SECONDS,
        };
      }
    }
  }

  const studentId = String(body?.student_id || "").trim();
  const phone = cleanPhone(body?.phone);

  if (!studentId || !phone) {
    return null;
  }

  const { data: student } = await supabase
    .from("students")
    .select("student_id, phone, is_e8, is_archived")
    .eq("student_id", studentId)
    .maybeSingle();

  if (
    !student ||
    student.is_archived === true ||
    student.is_e8 !== true ||
    cleanPhone(student.phone) !== phone
  ) {
    return null;
  }

  return {
    personType: "e8",
    personId: student.student_id,
    requiredSeconds: E8_REQUIRED_SECONDS,
  };
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ success: false, message: "Method not allowed." }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return json(
        { success: false, message: "Service configuration is missing." },
        500
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const identity = await identifyPerson(req, supabase, body);

    if (!identity) {
      return json(
        { success: false, message: "Not authorized for EGA service hours." },
        403
      );
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const serviceDate = ethiopiaDate();

    const { data: existing, error: loadError } = await supabase
      .from("service_hour_sessions")
      .select("*")
      .eq("person_type", identity.personType)
      .eq("person_id", identity.personId)
      .eq("service_date", serviceDate)
      .maybeSingle();

    if (loadError) {
      return json(
        { success: false, message: "Unable to load service-hour record." },
        500
      );
    }

    if (!existing) {
      const { data: created, error: createError } = await supabase
        .from("service_hour_sessions")
        .insert({
          person_type: identity.personType,
          person_id: identity.personId,
          service_date: serviceDate,
          started_at: nowIso,
          last_activity_at: nowIso,
          active_seconds: 0,
          required_seconds: identity.requiredSeconds,
          extra_seconds: 0,
        })
        .select()
        .single();

      if (createError) {
        return json(
          { success: false, message: "Unable to start service-hour record." },
          500
        );
      }

      return json({
        success: true,
        status: "started",
        service: created,
      });
    }

    const lastActivity = new Date(existing.last_activity_at).getTime();
    const elapsedSeconds = Math.max(
      0,
      Math.floor((now.getTime() - lastActivity) / 1000)
    );

    // Only count recent activity. If more than 10 minutes passed,
    // do not count the inactive gap.
    const countedSeconds =
      elapsedSeconds > 0 && elapsedSeconds <= 600
        ? Math.min(elapsedSeconds, 120)
        : 0;

    const newActiveSeconds =
      Number(existing.active_seconds || 0) + countedSeconds;

    const requiredSeconds = identity.requiredSeconds;
    const extraSeconds = Math.max(0, newActiveSeconds - requiredSeconds);

    const completedAt =
      existing.completed_at ||
      (newActiveSeconds >= requiredSeconds ? nowIso : null);

    const { data: updated, error: updateError } = await supabase
      .from("service_hour_sessions")
      .update({
        last_activity_at: nowIso,
        active_seconds: newActiveSeconds,
        required_seconds: requiredSeconds,
        extra_seconds: extraSeconds,
        completed_at: completedAt,
        updated_at: nowIso,
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (updateError) {
      return json(
        { success: false, message: "Unable to update service hours." },
        500
      );
    }

    return json({
      success: true,
      status:
        newActiveSeconds >= requiredSeconds ? "completed" : "in_progress",
      service: updated,
      remaining_seconds: Math.max(
        0,
        requiredSeconds - newActiveSeconds
      ),
      extra_seconds: extraSeconds,
    });
  } catch (error) {
    console.error("service-hours-heartbeat error:", error);

    return json(
      { success: false, message: "Unexpected service-hours error." },
      500
    );
  }
});