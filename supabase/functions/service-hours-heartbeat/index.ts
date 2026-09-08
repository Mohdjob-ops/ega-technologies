import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function requiredSecondsFor(personType: ServiceIdentity["personType"]) {
  if (personType === "e8") return 4 * 60 * 60;
  return 8 * 60 * 60;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function ethiopiaParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Addis_Ababa",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
}

function ethiopiaServiceDate(date = new Date()) {
  const parts = ethiopiaParts(date);
  const calendarDate = `${parts.year}-${parts.month}-${parts.day}`;
  if (Number(parts.hour) >= 6) return calendarDate;

  const previous = new Date(`${calendarDate}T00:00:00Z`);
  previous.setUTCDate(previous.getUTCDate() - 1);
  return previous.toISOString().slice(0, 10);
}
function cleanPhone(value: unknown) {
  let phone = String(value || "").replace(/\D/g, "");

  if (phone.startsWith("251") && phone.length === 12) {
    phone = "0" + phone.slice(3);
  }

  return phone;
}

type ServiceIdentity = {
  personType: "admin" | "assistant" | "e8";
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
      const { data: assistant } = await supabase
      .from("assistant_users")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("active", true)
      .maybeSingle();

    if (assistant) {
      return {
        personType: "assistant",
        personId: user.id,
        requiredSeconds: requiredSecondsFor("assistant"),
      };
    }

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
          requiredSeconds: requiredSecondsFor("admin"),
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
    requiredSeconds: requiredSecondsFor("e8"),
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
    const serviceDate = ethiopiaServiceDate(now);
    const isSunday =
      new Date(`${serviceDate}T00:00:00Z`).getUTCDay() === 0;

    const action = body?.action || "check_in";
    const { data: existing, error: loadError } = await supabase
      .from("service_hour_sessions")
      .select("*")
      .eq("person_type", identity.personType)
      .eq("person_id", identity.personId)
      .eq("service_date", serviceDate)
      .order("created_at", { ascending: false });

    if (loadError) {
      return json(
        { success: false, message: "Unable to load service-hour record." },
        500
      );
    }

    const openSession = (existing || []).find((session: any) => !session.ended_at);

    if (action === "status") {
      return json({
        success: true,
        service: openSession || existing?.[0] || null,
        history: existing || [],
      });
    }

    if (action === "check_in") {
      if (openSession) {
        return json({ success: true, status: "already_checked_in", service: openSession });
      }

      const notes = String(body?.notes || "").trim();
      if (notes.length > 2000) {
        return json({ success: false, message: "Service notes must be 2,000 characters or fewer." }, 400);
      }

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
          approval_status: "pending",
          notes: notes || null,
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
        status: "checked_in",
        service: created,
      });
    }

    if (action !== "check_out") {
      return json({ success: false, message: "Unknown service-hours action." }, 400);
    }

    if (!openSession) {
      return json({ success: false, message: "No open service session to check out." }, 400);
    }

    const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - new Date(openSession.started_at).getTime()) / 1000));
    const newActiveSeconds = Math.max(Number(openSession.active_seconds || 0), elapsedSeconds);

    const requiredSeconds = isSunday ? 0 : identity.requiredSeconds;
    const extraSeconds = Math.max(0, newActiveSeconds - requiredSeconds);

    const completedAt =
      openSession.completed_at ||
      (newActiveSeconds >= requiredSeconds ? nowIso : null);

    const { data: updated, error: updateError } = await supabase
      .from("service_hour_sessions")
      .update({
        last_activity_at: nowIso,
        ended_at: nowIso,
        active_seconds: newActiveSeconds,
        required_seconds: requiredSeconds,
        extra_seconds: extraSeconds,
        completed_at: completedAt,
        updated_at: nowIso,
      })
      .eq("id", openSession.id)
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
      status: "checked_out",
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