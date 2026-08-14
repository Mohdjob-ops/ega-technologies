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

async function getAccessToken(
  apiBase: string,
  clientId: string,
  clientSecret: string
) {
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

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ success: false, message: "Method not allowed." });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
    const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");
    const environment = (Deno.env.get("PAYPAL_ENVIRONMENT") || "sandbox").toLowerCase();
    const etbPerUsd = Number(Deno.env.get("PAYPAL_ETB_PER_USD"));
    const returnUrl = Deno.env.get("PAYPAL_RETURN_URL");
    const cancelUrl = Deno.env.get("PAYPAL_CANCEL_URL");

    if (
      !supabaseUrl ||
      !serviceRoleKey ||
      !clientId ||
      !clientSecret ||
      !returnUrl ||
      !cancelUrl ||
      !Number.isFinite(etbPerUsd) ||
      etbPerUsd <= 0
    ) {
      return jsonResponse({
        success: false,
        message: "Required PayPal server environment variables are missing or invalid.",
      });
    }

    const body = await request.json().catch(() => null);
    const studentId = String(body?.student_id || "").trim();

    if (!studentId) {
      return jsonResponse({ success: false, message: "Student ID is required." });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id,student_id,name,fee,paid_amount,remaining_amount,payment_status")
      .eq("student_id", studentId)
      .maybeSingle();

    if (studentError) {
      return jsonResponse({
        success: false,
        message: `Student lookup failed: ${studentError.message}`,
      });
    }

    if (!student) {
      return jsonResponse({ success: false, message: "Student was not found." });
    }

    if (String(student.payment_status || "").toLowerCase() === "paid") {
      return jsonResponse({ success: false, message: "This student is already marked Paid." });
    }

    const fee = Number(student.fee || 0);
    const paidAmount = Number(student.paid_amount || 0);
    let remainingAmount = Number(student.remaining_amount);

    if (!Number.isFinite(remainingAmount) || remainingAmount <= 0) {
      remainingAmount = Math.max(fee - paidAmount, 0);
    }

    if (!Number.isFinite(remainingAmount) || remainingAmount <= 0) {
      return jsonResponse({
        success: false,
        message: "The remaining payment amount is missing or invalid.",
      });
    }

    const paypalAmount = Math.ceil((remainingAmount / etbPerUsd) * 100) / 100;
    const apiBase = environment === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";
    const accessToken = await getAccessToken(apiBase, clientId, clientSecret);
    const requestId = crypto.randomUUID();
    const returnSeparator = returnUrl.includes("?") ? "&" : "?";
    const cancelSeparator = cancelUrl.includes("?") ? "&" : "?";

    const orderResponse = await fetch(`${apiBase}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": requestId,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          reference_id: student.student_id,
          custom_id: student.student_id,
          description: `EGA course payment for ${student.student_id}`,
          amount: { currency_code: "USD", value: paypalAmount.toFixed(2) },
        }],
        payment_source: {
          paypal: {
            experience_context: {
              user_action: "PAY_NOW",
              return_url:
                `${returnUrl}${returnSeparator}student_id=${encodeURIComponent(student.student_id)}`,
              cancel_url:
                `${cancelUrl}${cancelSeparator}paypal_cancelled=1&student_id=${encodeURIComponent(student.student_id)}`,
            },
          },
        },
      }),
    });
    const order = await readJson(orderResponse);

    if (!orderResponse.ok || !order.id) {
      return jsonResponse({
        success: false,
        message: order.message || `PayPal order creation failed with HTTP ${orderResponse.status}.`,
        paypal: order,
      });
    }

    const approvalUrl = Array.isArray(order.links)
      ? order.links.find((link: { rel?: string }) => link.rel === "payer-action" || link.rel === "approve")?.href
      : "";

    if (!approvalUrl) {
      return jsonResponse({ success: false, message: "PayPal did not return an approval URL." });
    }

    const { error: attemptError } = await supabase.rpc(
      "record_paypal_payment_attempt",
      {
        p_student_id: student.student_id,
        p_order_id: String(order.id),
        p_expected_amount_etb: remainingAmount,
        p_paypal_amount: paypalAmount,
        p_paypal_currency: "USD",
      }
    );

    if (attemptError) {
      return jsonResponse({
        success: false,
        message: `PayPal order could not be recorded safely: ${attemptError.message}`,
      });
    }

    return jsonResponse({
      success: true,
      order_id: String(order.id),
      approval_url: String(approvalUrl),
      amount: paypalAmount,
      currency: "USD",
      ledger_amount: remainingAmount,
      ledger_currency: "ETB",
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      message: error instanceof Error ? error.message : "Unknown PayPal initialization error.",
    });
  }
});
