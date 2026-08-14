import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function readJson(response: Response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: text || "PayPal returned an unreadable response." };
  }
}

async function getAccessToken(apiBase: string, clientId: string, clientSecret: string) {
  const response = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const result = await readJson(response);
  if (!response.ok || !result.access_token) {
    throw new Error(result.error_description || "PayPal authentication failed.");
  }
  return String(result.access_token);
}

function completedCapture(order: any) {
  const captures = order?.purchase_units?.[0]?.payments?.captures;
  return Array.isArray(captures)
    ? captures.find((capture: any) => String(capture?.status || "").toUpperCase() === "COMPLETED")
    : null;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") {
    return jsonResponse({ success: false, verified: false, message: "Method not allowed." });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
    const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");
    const environment = (Deno.env.get("PAYPAL_ENVIRONMENT") || "sandbox").toLowerCase();

    if (!supabaseUrl || !serviceRoleKey || !clientId || !clientSecret) {
      return jsonResponse({
        success: false,
        verified: false,
        message: "Required PayPal server environment variables are missing.",
      });
    }

    const body = await request.json().catch(() => null);
    const studentId = String(body?.student_id || "").trim();
    const orderId = String(body?.order_id || "").trim();

    if (!studentId || !/^[A-Z0-9]+$/.test(orderId)) {
      return jsonResponse({
        success: false,
        verified: false,
        message: "A valid student ID and PayPal order ID are required.",
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: attempt, error: attemptError } = await supabase
      .from("paypal_payment_attempts")
      .select("order_id,student_id,paypal_amount,paypal_currency,status,capture_id")
      .eq("order_id", orderId)
      .eq("student_id", studentId)
      .maybeSingle();

    if (attemptError || !attempt) {
      return jsonResponse({
        success: false,
        verified: false,
        message: attemptError
          ? `PayPal attempt lookup failed: ${attemptError.message}`
          : "This PayPal order was not initialized for this student.",
      });
    }

    if (String(attempt.status).toLowerCase() === "verified") {
      const { data: student } = await supabase
        .from("students")
        .select("*")
        .eq("student_id", studentId)
        .maybeSingle();
      return jsonResponse({
        success: true,
        verified: true,
        already_verified: true,
        student,
        payment: {
          order_id: orderId,
          capture_id: attempt.capture_id,
          amount: Number(attempt.paypal_amount),
          currency: attempt.paypal_currency,
          status: "COMPLETED",
        },
      });
    }

    const apiBase = environment === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";
    const accessToken = await getAccessToken(apiBase, clientId, clientSecret);
    const orderResponse = await fetch(`${apiBase}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    let order = await readJson(orderResponse);

    if (!orderResponse.ok) {
      return jsonResponse({
        success: false,
        verified: false,
        message: order.message || "PayPal order verification failed.",
      });
    }

    const orderStudentId = String(order?.purchase_units?.[0]?.custom_id || "").trim();
    if (orderStudentId !== studentId) {
      return jsonResponse({
        success: false,
        verified: false,
        message: "The PayPal order does not belong to this student.",
      });
    }

    if (String(order.status || "").toUpperCase() !== "COMPLETED") {
      if (String(order.status || "").toUpperCase() !== "APPROVED") {
        return jsonResponse({
          success: false,
          verified: false,
          message: `PayPal order status is ${order.status || "unknown"}; no student record was changed.`,
        });
      }

      const captureResponse = await fetch(
        `${apiBase}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "PayPal-Request-Id": `capture-${orderId}`,
          },
          body: "{}",
        }
      );
      order = await readJson(captureResponse);

      if (!captureResponse.ok) {
        return jsonResponse({
          success: false,
          verified: false,
          message: order.message || `PayPal capture failed with HTTP ${captureResponse.status}.`,
          paypal: order,
        });
      }
    }

    const capture = completedCapture(order);
    const captureAmount = Number(capture?.amount?.value);
    const captureCurrency = String(capture?.amount?.currency_code || "").toUpperCase();

    if (
      !capture ||
      !Number.isFinite(captureAmount) ||
      Math.abs(captureAmount - Number(attempt.paypal_amount)) > 0.01 ||
      captureCurrency !== String(attempt.paypal_currency).toUpperCase()
    ) {
      return jsonResponse({
        success: false,
        verified: false,
        message: "PayPal capture is not completed or its amount/currency does not match.",
      });
    }

    const { data: result, error: applyError } = await supabase.rpc(
      "apply_verified_paypal_payment",
      {
        p_student_id: studentId,
        p_order_id: orderId,
        p_capture_id: String(capture.id),
        p_paypal_amount: captureAmount,
        p_paypal_currency: captureCurrency,
        p_paid_at: capture.create_time || new Date().toISOString(),
      }
    );

    if (applyError) {
      return jsonResponse({
        success: false,
        verified: false,
        message: `Verified PayPal payment could not be applied: ${applyError.message}`,
      });
    }

    return jsonResponse({
      success: true,
      verified: true,
      already_verified: Boolean(result?.already_verified),
      student: result?.student,
      payment: {
        order_id: orderId,
        capture_id: String(capture.id),
        amount: captureAmount,
        currency: captureCurrency,
        status: "COMPLETED",
      },
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      verified: false,
      message: error instanceof Error ? error.message : "Unknown PayPal capture error.",
    });
  }
});
