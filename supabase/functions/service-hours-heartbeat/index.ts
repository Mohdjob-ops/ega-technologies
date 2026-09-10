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
  if (Number(parts.hour) < 6) {
    return addCalendarDays(`${parts.year}-${parts.month}-${parts.day}`, -1);
  }
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function addCalendarDays(serviceDate: string, days: number) {
  const date = new Date(`${serviceDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function ethiopiaServiceDayStartUtc(serviceDate: string) {
  return new Date(`${serviceDate}T03:00:00.000Z`);
}

function serviceDayEnd(serviceDate: string) {
  return ethiopiaServiceDayStartUtc(addCalendarDays(serviceDate, 1));
}

function isSunday(serviceDate: string) {
  return new Date(`${serviceDate}T00:00:00Z`).getUTCDay() === 0;
}

function elapsedSeconds(startedAt: string, endedAt: string) {
  return Math.max(
    0,
    Math.floor(
      (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000,
    ),
  );
}

function splitByEthiopiaDay(startedAt: string, endedAt: string) {
  const start = new Date(startedAt);
  const end = new Date(endedAt);
  const segments: Array<{
    serviceDate: string;
    startedAt: string;
    endedAt: string;
    activeSeconds: number;
  }> = [];
  let cursor = start;

  while (cursor < end) {
    const serviceDate = ethiopiaServiceDate(cursor);
    const nextServiceDayStart = ethiopiaServiceDayStartUtc(addCalendarDays(serviceDate, 1));
    const segmentEnd = new Date(Math.min(nextServiceDayStart.getTime(), end.getTime()));
    segments.push({
      serviceDate,
      startedAt: cursor.toISOString(),
      endedAt: segmentEnd.toISOString(),
      activeSeconds: elapsedSeconds(cursor.toISOString(), segmentEnd.toISOString()),
    });
    cursor = segmentEnd;
  }

  return segments;
}

function cleanPhone(value: unknown) {
  let phone = String(value || "").replace(/\D/g, "");

  if (phone.startsWith("251") && phone.length === 12) {
    phone = "0" + phone.slice(3);
  }

  return phone;
}

function cleanStudentId(value: unknown) {
  const digits = String(value || "")
    .trim()
    .replace(/^EGA-2026-/i, "")
    .replace(/\D/g, "");

  return digits ? `EGA-2026-${digits}` : "";
}

type ServiceIdentity = {
  personType: "admin" | "assistant" | "e8";
  personId: string;
  requiredSeconds: number;
};

function dailySummary(sessions: any[], serviceDate: string, openSession: any) {
  const today = sessions.filter((session) => session.service_date === serviceDate);
  if (!today.length) return null;
  const approved = today.filter((session) => session.approval_status === "approved");
  const activeSeconds = approved.reduce((total, session) => total + Number(session.active_seconds || 0), 0);
  const requiredSeconds = Number(today[0]?.required_seconds || openSession?.required_seconds || 0);
  const latest = [...today].sort((a, b) => String(b.started_at).localeCompare(String(a.started_at)))[0] || null;
  return {
    ...(latest || openSession || {}),
    active_seconds: activeSeconds,
    required_seconds: requiredSeconds,
    extra_seconds: Math.max(0, activeSeconds - requiredSeconds),
    completed_at: approved.find((session) => session.completed_at)?.completed_at || null,
    ended_at: openSession ? null : latest?.ended_at || null,
    last_activity_at: today.reduce((latestActivity, session) => String(session.last_activity_at || "") > latestActivity ? String(session.last_activity_at || "") : latestActivity, "") || null,
  };
}

function newestFirst(sessions: any[]) {
  return [...sessions].sort((a, b) =>
    String(b.started_at || b.created_at || "").localeCompare(
      String(a.started_at || a.created_at || ""),
    ),
  );
}

async function identifyPerson(
  req: Request,
  supabase: any,
  body: any
): Promise<ServiceIdentity | null> {
  const studentId = cleanStudentId(body?.student_id);
  const phone = cleanPhone(body?.phone);

  // Learner credentials must win over a stale Supabase admin session when
  // the same browser switches from Main Admin back to the learner portal.
  if (studentId || phone) {
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

  return null;
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
    const serviceRequiredSeconds = isSunday(serviceDate) ? 0 : identity.requiredSeconds;

    const action = body?.action || "check_in";
    const { data: existing, error: loadError } = await supabase
      .from("service_hour_sessions")
      .select("*")
      .eq("person_type", identity.personType)
      .eq("person_id", identity.personId)
      .order("created_at", { ascending: false });

    if (loadError) {
      return json(
        { success: false, message: "Unable to load service-hour record." },
        500
      );
    }

    let openSession = (existing || []).find((session: any) => !session.ended_at);

    if (openSession && openSession.service_date !== serviceDate) {
      const end = serviceDayEnd(openSession.service_date);
      const requiredSeconds = isSunday(openSession.service_date)
        ? 0
        : identity.requiredSeconds;
      const { data: closed } = await supabase
        .from("service_hour_sessions")
        .update({
          ended_at: end.toISOString(),
          active_seconds: elapsedSeconds(openSession.started_at, end.toISOString()),
          extra_seconds: Math.max(0, elapsedSeconds(openSession.started_at, end.toISOString()) - requiredSeconds),
          last_activity_at: openSession.last_active_at || openSession.last_activity_at,
          required_seconds: requiredSeconds,
          updated_at: nowIso,
        })
        .eq("id", openSession.id)
        .select()
        .single();
      if (closed) existing?.unshift(closed);
      const nextServiceDate = serviceDate;
      const nextRequiredSeconds = isSunday(nextServiceDate) ? 0 : identity.requiredSeconds;
      const { data: continued, error: continueError } = await supabase
        .from("service_hour_sessions")
        .insert({
          person_type: identity.personType,
          person_id: identity.personId,
          service_date: nextServiceDate,
          started_at: end.toISOString(),
          last_activity_at: openSession.last_active_at || openSession.last_activity_at,
          last_heartbeat_at: nowIso,
          last_active_at: openSession.last_active_at || openSession.last_activity_at,
          active_seconds: 0,
          required_seconds: nextRequiredSeconds,
          extra_seconds: 0,
          approval_status: "pending",
          notes: openSession.notes || null,
        })
        .select()
        .single();
      if (continueError) {
        return json({ success: false, message: "Unable to continue service hours across the calendar day." }, 500);
      }
      openSession = continued;
      if (continued) existing?.unshift(continued);
    }

    if (action === "status") {
      return json({
        success: true,
        service: dailySummary(existing || [], serviceDate, openSession),
        history: newestFirst(existing || []),
      });
    }

    if (action === "heartbeat") {
      if (!openSession) {
        return json({ success: false, message: "No open service session to update." }, 400);
      }

      const activeAt = new Date(String(body?.active_at || nowIso));
      if (Number.isNaN(activeAt.getTime()) || now.getTime() - activeAt.getTime() > 45_000) {
        return json({ success: true, status: "paused", service: openSession });
      }

      const { data: updated, error: heartbeatError } = await supabase.rpc("record_service_heartbeat", {
        p_session_id: openSession.id,
        p_heartbeat_at: nowIso,
        p_active_at: activeAt.toISOString(),
        p_max_interval_seconds: 30,
      });

      if (heartbeatError) {
        return json({ success: false, message: "Unable to record active heartbeat." }, 500);
      }

      const refreshed = [...(existing || []).filter((session: any) => session.id !== updated.id), updated];
      return json({ success: true, status: "active", service: dailySummary(refreshed, serviceDate, updated), history: newestFirst(refreshed) });
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
          last_heartbeat_at: nowIso,
          last_active_at: nowIso,
          active_seconds: 0,
          required_seconds: serviceRequiredSeconds,
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
        service: dailySummary([...(existing || []), created], serviceDate, created),
        history: newestFirst([created, ...(existing || [])]),
      });
    }

    if (action !== "check_out") {
      return json({ success: false, message: "Unknown service-hours action." }, 400);
    }

    if (!openSession) {
      return json({ success: false, message: "No open service session to check out." }, 400);
    }

    const effectiveNow = now;
    const segments = splitByEthiopiaDay(openSession.started_at, effectiveNow.toISOString());
    const firstSegment = segments[0];
    const requiredSeconds = isSunday(firstSegment.serviceDate) ? 0 : identity.requiredSeconds;
    const newActiveSeconds = firstSegment.activeSeconds;
    const extraSeconds = Math.max(0, newActiveSeconds - requiredSeconds);
    const completedAt = newActiveSeconds >= requiredSeconds ? firstSegment.endedAt : null;

    const checkoutNotes = String(body?.notes || "").trim();
    if (checkoutNotes.length > 2000) {
      return json({ success: false, message: "Service notes must be 2,000 characters or fewer." }, 400);
    }

    const { data: updated, error: updateError } = await supabase
      .from("service_hour_sessions")
      .update({
        last_activity_at: openSession.last_active_at || openSession.last_activity_at,
        ended_at: firstSegment.endedAt,
        active_seconds: newActiveSeconds,
        required_seconds: requiredSeconds,
        extra_seconds: extraSeconds,
        completed_at: completedAt,
        service_date: firstSegment.serviceDate,
        notes: checkoutNotes || openSession.notes || null,
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

    const additionalSegments = segments.slice(1).map((segment) => {
      const segmentRequiredSeconds = isSunday(segment.serviceDate) ? 0 : identity.requiredSeconds;
      return {
        person_type: identity.personType,
        person_id: identity.personId,
        service_date: segment.serviceDate,
        started_at: segment.startedAt,
        last_activity_at: openSession.last_active_at || openSession.last_activity_at,
        ended_at: segment.endedAt,
        active_seconds: segment.activeSeconds,
        required_seconds: segmentRequiredSeconds,
        extra_seconds: Math.max(0, segment.activeSeconds - segmentRequiredSeconds),
        completed_at: segment.activeSeconds >= segmentRequiredSeconds ? segment.endedAt : null,
        approval_status: "pending",
        notes: checkoutNotes || openSession.notes || null,
      };
    });
    let insertedSegments: any[] = [];
    if (additionalSegments.length) {
      const { data: inserted, error: insertError } = await supabase
        .from("service_hour_sessions")
        .insert(additionalSegments)
        .select();
      if (insertError) {
        return json({ success: false, message: "Unable to split service hours across calendar days." }, 500);
      }
      insertedSegments = inserted || [];
    }

    return json({
      success: true,
      status: "checked_out",
      service: dailySummary([...(existing || []).filter((session: any) => session.id !== updated.id), updated, ...insertedSegments], firstSegment.serviceDate, null),
      history: newestFirst([updated, ...insertedSegments, ...(existing || []).filter((session: any) => session.id !== updated.id)]),
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