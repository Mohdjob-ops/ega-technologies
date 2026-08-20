import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function cleanPhone(value: unknown) {
  let phone = String(value || "").replace(/\D/g, "");

  if (phone.startsWith("251") && phone.length === 12) {
    phone = "0" + phone.slice(3);
  }

  return phone;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      {
        success: false,
        message: "Method not allowed.",
      },
      405
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY"
    );

    if (!supabaseUrl || !serviceRoleKey) {
      console.error(
        "Required Supabase environment variables are missing."
      );

      return jsonResponse(
        {
          success: false,
          message: "Server configuration error.",
        },
        500
      );
    }

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        {
          success: false,
          message: "Invalid request body.",
        },
        400
      );
    }

    const studentId = String(
      body.student_id || ""
    )
      .trim()
      .toUpperCase();

    const phone = cleanPhone(body.phone);

    if (!studentId || !phone) {
      return jsonResponse(
        {
          success: false,
          message:
            "Student ID and phone number are required.",
        },
        400
      );
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { data: student, error: studentError } =
      await supabase
        .from("students")
        .select(
          [
            "student_id",
            "name",
            "email",
            "phone",
            "course",
            "language",
            "fee",
            "payment_status",
            "payment_method",
            "payment_reference",
            "paid_at",
            "html_score",
            "html_quiz_score",
            "html_completed",
            "certificate_status",
            "css_score",
            "css_quiz_score",
            "css_completed",
            "css_certificate_status",
            "js_score",
            "js_quiz_score",
            "js_completed",
            "js_certificate_status",
          ].join(",")
        )
        .eq("student_id", studentId)
        .maybeSingle();

    if (studentError) {
      console.error(
        "Learner lookup failed:",
        studentError
      );

      return jsonResponse(
        {
          success: false,
          message: "Unable to verify learner.",
        },
        500
      );
    }

    if (
      !student ||
      cleanPhone(student.phone) !== phone
    ) {
      return jsonResponse(
        {
          success: false,
          message:
            "Student ID or phone number is incorrect.",
        },
        401
      );
    }

    const { data: quizResults, error: quizError } =
      await supabase
        .from("quiz_results")
        .select(
          [
            "id",
            "student_id",
            "course",
            "quiz_name",
            "score",
            "total",
            "percentage",
            "passed",
            "created_at",
          ].join(",")
        )
        .eq("student_id", student.student_id)
        .order("created_at", {
          ascending: false,
        });

    if (quizError) {
      console.error(
        "Quiz result lookup failed:",
        quizError
      );

      return jsonResponse(
        {
          success: false,
          message:
            "Learner verified, but quiz results could not be loaded.",
        },
        500
      );
    }

    return jsonResponse({
      success: true,
      student,
      quiz_results: quizResults || [],
    });
  } catch (error) {
    console.error("learner-access error:", error);

    return jsonResponse(
      {
        success: false,
        message: "Unexpected server error.",
      },
      500
    );
  }
});
