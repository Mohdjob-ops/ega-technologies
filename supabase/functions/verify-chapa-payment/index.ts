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
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function lowerText(value: unknown) {
  return cleanText(value).toLowerCase();
}

function toNumber(value: unknown) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? numberValue
    : 0;
}

async function readJsonSafely(response: Response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      status: "failed",
      message: text,
    };
  }
}

function getTransaction(
  chapaData: unknown,
  expectedTxRef: string
) {
  if (Array.isArray(chapaData)) {
    const matchedTransaction = chapaData.find(
      (item) => {
        const itemReference = cleanText(
          item?.tx_ref ||
          item?.trx_ref ||
          item?.reference ||
          item?.merchant_reference
        );

        return itemReference === expectedTxRef;
      }
    );

    return matchedTransaction || chapaData[0] || {};
  }

  if (
    chapaData &&
    typeof chapaData === "object"
  ) {
    return chapaData;
  }

  return {};
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return jsonResponse({
      success: false,
      verified: false,
      message: "Method not allowed.",
    });
  }

  try {
    const supabaseUrl =
      Deno.env.get("SUPABASE_URL");

    const serviceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const chapaSecretKey =
      Deno.env.get("CHAPA_SECRET_KEY");

    if (
      !supabaseUrl ||
      !serviceRoleKey ||
      !chapaSecretKey
    ) {
      return jsonResponse({
        success: false,
        verified: false,
        message:
          "Required server environment variables are missing.",
      });
    }

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return jsonResponse({
        success: false,
        verified: false,
        message: "Invalid request body.",
      });
    }

    const studentId = cleanText(
      body.student_id
    );

    const txRef = cleanText(
      body.tx_ref || body.trx_ref
    );

    if (!studentId || !txRef) {
      return jsonResponse({
        success: false,
        verified: false,
        message:
          "Student ID and transaction reference are required.",
      });
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey
    );

    const {
      data: student,
      error: studentError,
    } = await supabase
      .from("students")
      .select(
        [
          "id",
          "student_id",
          "name",
          "fee",
          "paid_amount",
          "remaining_amount",
          "payment_status",
          "payment_method",
          "payment_reference",
          "paid_at",
        ].join(",")
      )
      .eq("student_id", studentId)
      .maybeSingle();

    if (studentError) {
      return jsonResponse({
        success: false,
        verified: false,
        message:
          "Student lookup failed: " +
          studentError.message,
      });
    }

    if (!student) {
      return jsonResponse({
        success: false,
        verified: false,
        message: "Student was not found.",
      });
    }

    const storedReference = cleanText(
      student.payment_reference
    );

    if (!storedReference) {
      return jsonResponse({
        success: false,
        verified: false,
        message:
          "No Chapa payment was initialized for this student.",
      });
    }

    if (storedReference !== txRef) {
      return jsonResponse({
        success: false,
        verified: false,
        message:
          "This transaction reference does not belong to this student.",
      });
    }

    const transactionNote =
      `Chapa verified payment: ${txRef}`;

    const {
      data: existingTransaction,
      error: existingTransactionError,
    } = await supabase
      .from("transactions")
      .select("id, amount")
      .eq("student_id", student.student_id)
      .eq("note", transactionNote)
      .maybeSingle();

    if (existingTransactionError) {
      console.error(
        "Existing transaction lookup failed:",
        existingTransactionError.message
      );
    }

    if (
      existingTransaction &&
      lowerText(student.payment_status) ===
        "paid"
    ) {
      return jsonResponse({
        success: true,
        verified: true,
        message:
          "This payment was already verified.",
        student,
        payment: {
          tx_ref: txRef,
          amount: toNumber(
            existingTransaction.amount
          ),
          currency: "ETB",
          method:
            student.payment_method || "Chapa",
          status: "success",
        },
      });
    }

    const chapaResponse = await fetch(
      "https://api.chapa.co/v1/transaction/verify/" +
        encodeURIComponent(txRef),
      {
        method: "GET",
        headers: {
          Authorization:
            `Bearer ${chapaSecretKey}`,
          Accept: "application/json",
        },
      }
    );

    const chapaResult =
      await readJsonSafely(chapaResponse);

    console.log(
      "Chapa verification HTTP status:",
      chapaResponse.status
    );

    console.log(
      "Chapa verification response:",
      JSON.stringify(chapaResult)
    );

    if (!chapaResponse.ok) {
      return jsonResponse({
        success: false,
        verified: false,
        message:
          cleanText(chapaResult?.message) ||
          cleanText(chapaResult?.error) ||
          `Chapa verification failed with HTTP ${chapaResponse.status}.`,
        chapa: chapaResult,
      });
    }

    const transaction = getTransaction(
      chapaResult?.data,
      txRef
    );

    const topLevelStatus = lowerText(
      chapaResult?.status
    );

    const transactionStatus = lowerText(
      transaction?.status ||
      chapaResult?.status
    );

    const successfulStatuses = [
      "success",
      "successful",
      "paid",
      "completed",
    ];

    const isTopLevelSuccessful =
      successfulStatuses.includes(
        topLevelStatus
      );

    const isTransactionSuccessful =
      successfulStatuses.includes(
        transactionStatus
      );

    if (
      !isTopLevelSuccessful ||
      !isTransactionSuccessful
    ) {
      return jsonResponse({
        success: false,
        verified: false,
        message:
          `Payment status is ${
            transactionStatus ||
            topLevelStatus ||
            "unknown"
          }.`,
        chapa: chapaResult,
      });
    }

    const returnedTxRef = cleanText(
      transaction?.tx_ref ||
      transaction?.trx_ref ||
      transaction?.reference ||
      transaction?.merchant_reference
    );

    if (
      returnedTxRef &&
      returnedTxRef !== txRef
    ) {
      return jsonResponse({
        success: false,
        verified: false,
        message:
          "Chapa returned a different transaction reference.",
        chapa: chapaResult,
      });
    }

    const currency = cleanText(
      transaction?.currency || "ETB"
    ).toUpperCase();

    if (currency !== "ETB") {
      return jsonResponse({
        success: false,
        verified: false,
        message:
          `Unexpected payment currency: ${currency}.`,
        chapa: chapaResult,
      });
    }

    const verifiedAmount = toNumber(
      transaction?.amount
    );

    if (verifiedAmount <= 0) {
      return jsonResponse({
        success: false,
        verified: false,
        message:
          "Chapa returned an invalid payment amount.",
        chapa: chapaResult,
      });
    }

    const fee = toNumber(student.fee);

    const currentPaidAmount = toNumber(
      student.paid_amount
    );

    const storedRemainingAmount = toNumber(
      student.remaining_amount
    );

    const expectedAmount =
      storedRemainingAmount > 0
        ? storedRemainingAmount
        : Math.max(
            fee - currentPaidAmount,
            0
          );

    if (
      expectedAmount > 0 &&
      Math.abs(
        verifiedAmount - expectedAmount
      ) > 0.01
    ) {
      return jsonResponse({
        success: false,
        verified: false,
        message:
          `Payment amount mismatch. Expected ` +
          `${expectedAmount} ETB, but Chapa verified ` +
          `${verifiedAmount} ETB.`,
        chapa: chapaResult,
      });
    }

    const newPaidAmount =
      fee > 0
        ? Math.min(
            currentPaidAmount +
              verifiedAmount,
            fee
          )
        : currentPaidAmount +
          verifiedAmount;

    const newRemainingAmount =
      fee > 0
        ? Math.max(
            fee - newPaidAmount,
            0
          )
        : 0;

    const newPaymentStatus =
      newRemainingAmount <= 0
        ? "Paid"
        : "Partial";

    const paymentMethod =
      cleanText(
        transaction?.method ||
        transaction?.payment_method ||
        transaction?.channel
      ) || "Chapa";

    const paidAt =
      cleanText(
        transaction?.updated_at ||
        transaction?.created_at ||
        transaction?.paid_at
      ) || new Date().toISOString();

    if (!existingTransaction) {
      const {
        error: transactionInsertError,
      } = await supabase
        .from("transactions")
        .insert({
          student_id: student.student_id,
          student_name:
            student.name || "Unknown",
          amount: verifiedAmount,
          payment_method: paymentMethod,
          note: transactionNote,
        });

      if (transactionInsertError) {
        return jsonResponse({
          success: false,
          verified: true,
          message:
            "Payment was verified, but transaction history could not be saved: " +
            transactionInsertError.message,
        });
      }
    }

    const {
      data: updatedStudent,
      error: updateError,
    } = await supabase
      .from("students")
      .update({
        payment_status: newPaymentStatus,
        payment_method: paymentMethod,
        payment_reference: txRef,
        paid_amount: newPaidAmount,
        remaining_amount:
          newRemainingAmount,
        paid_at: paidAt,
      })
      .eq("id", student.id)
      .select("*")
      .single();

    if (updateError) {
      return jsonResponse({
        success: false,
        verified: true,
        message:
          "Payment was verified, but the student record could not be updated: " +
          updateError.message,
      });
    }

    console.log(
      "Payment verified and student updated:",
      JSON.stringify({
        student_id: student.student_id,
        tx_ref: txRef,
        verified_amount:
          verifiedAmount,
        payment_status:
          newPaymentStatus,
        paid_amount:
          newPaidAmount,
        remaining_amount:
          newRemainingAmount,
      })
    );

    return jsonResponse({
      success: true,
      verified: true,
      message:
        "Payment verified successfully.",
      student: updatedStudent,
      payment: {
        tx_ref: txRef,
        amount: verifiedAmount,
        currency,
        method: paymentMethod,
        status: transactionStatus,
      },
    });
  } catch (error) {
    console.error(
      "Unexpected verification error:",
      error
    );

    return jsonResponse({
      success: false,
      verified: false,
      message:
        error instanceof Error
          ? error.message
          : "Unexpected verification server error.",
    });
  }
});
