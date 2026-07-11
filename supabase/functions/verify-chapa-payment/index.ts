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

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeStatus(value: unknown) {
  return cleanText(value).toLowerCase();
}

function toNumber(value: unknown) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? numberValue
    : 0;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  /*
   * Return HTTP 200 for handled payment results.
   *
   * This allows the Expo app to read and display the real
   * Chapa verification message instead of only receiving:
   *
   * "Edge Function returned a non-2xx status code"
   */
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

    if (!supabaseUrl) {
      console.error("SUPABASE_URL is missing");

      return jsonResponse({
        success: false,
        verified: false,
        message: "SUPABASE_URL is missing.",
      });
    }

    if (!serviceRoleKey) {
      console.error(
        "SUPABASE_SERVICE_ROLE_KEY is missing"
      );

      return jsonResponse({
        success: false,
        verified: false,
        message:
          "SUPABASE_SERVICE_ROLE_KEY is missing.",
      });
    }

    if (!chapaSecretKey) {
      console.error("CHAPA_SECRET_KEY is missing");

      return jsonResponse({
        success: false,
        verified: false,
        message:
          "CHAPA_SECRET_KEY is not configured.",
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

    if (!studentId) {
      return jsonResponse({
        success: false,
        verified: false,
        message: "Student ID is required.",
      });
    }

    if (!txRef) {
      return jsonResponse({
        success: false,
        verified: false,
        message:
          "Chapa transaction reference is required.",
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
      console.error(
        "Student lookup failed:",
        studentError
      );

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
          "No Chapa transaction was initialized for this student.",
      });
    }

    if (storedReference !== txRef) {
      console.error(
        "Transaction reference mismatch:",
        JSON.stringify({
          student_id: student.student_id,
          stored_reference: storedReference,
          received_reference: txRef,
        })
      );

      return jsonResponse({
        success: false,
        verified: false,
        message:
          "This Chapa transaction reference does not belong to this student.",
      });
    }

    /*
     * Idempotency:
     * If this exact transaction was already processed,
     * return success without adding the payment again.
     */
    const {
      data: existingTransaction,
      error: existingTransactionError,
    } = await supabase
      .from("transactions")
      .select("id, amount")
      .eq("student_id", student.student_id)
      .eq(
        "note",
        `Chapa verified payment: ${txRef}`
      )
      .maybeSingle();

    if (existingTransactionError) {
      console.error(
        "Existing transaction lookup failed:",
        existingTransactionError
      );
    }

    if (
      existingTransaction &&
      normalizeStatus(student.payment_status) ===
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

    const verifyUrl =
      "https://api.chapa.co/v1/transaction/verify/" +
      encodeURIComponent(txRef);

    console.log(
      "Verifying Chapa transaction:",
      JSON.stringify({
        student_id: student.student_id,
        tx_ref: txRef,
        verify_url: verifyUrl,
      })
    );

    const chapaResponse = await fetch(
      verifyUrl,
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
      const message =
        cleanText(chapaResult?.message) ||
        cleanText(chapaResult?.error) ||
        `Chapa verification failed with HTTP ${chapaResponse.status}.`;

      return jsonResponse({
        success: false,
        verified: false,
        message,
        chapa_status: chapaResponse.status,
        chapa: chapaResult,
      });
    }

    const transaction =
      chapaResult?.data || {};

    const topLevelStatus =
      normalizeStatus(chapaResult?.status);

    const paymentStatus =
      normalizeStatus(
        transaction?.status ||
          chapaResult?.status
      );

    const currency =
      cleanText(
        transaction?.currency || "ETB"
      ).toUpperCase();

    const verifiedTxRef =
      cleanText(
        transaction?.tx_ref ||
          transaction?.trx_ref ||
          transaction?.reference ||
          transaction?.merchant_reference ||
          txRef
      );

    const verifiedAmount =
      toNumber(transaction?.amount);

    const successfulStatuses = [
      "success",
      "successful",
      "completed",
      "paid",
    ];

    const isTopLevelSuccessful =
      successfulStatuses.includes(
        topLevelStatus
      );

    const isPaymentSuccessful =
      successfulStatuses.includes(
        paymentStatus
      );

    if (
      !isTopLevelSuccessful ||
      !isPaymentSuccessful
    ) {
      return jsonResponse({
        success: false,
        verified: false,
        message:
          `Payment status is ${
            paymentStatus ||
            topLevelStatus ||
            "unknown"
          }.`,
        chapa: chapaResult,
      });
    }

    if (
      verifiedTxRef &&
      verifiedTxRef !== txRef
    ) {
      console.error(
        "Chapa returned a different reference:",
        JSON.stringify({
          expected: txRef,
          received: verifiedTxRef,
        })
      );

      return jsonResponse({
        success: false,
        verified: false,
        message:
          "Chapa returned a different transaction reference.",
        chapa: chapaResult,
      });
    }

    if (currency !== "ETB") {
      return jsonResponse({
        success: false,
        verified: false,
        message:
          `Unexpected payment currency: ${
            currency || "unknown"
          }.`,
        chapa: chapaResult,
      });
    }

    if (
      !Number.isFinite(verifiedAmount) ||
      verifiedAmount <= 0
    ) {
      return jsonResponse({
        success: false,
        verified: false,
        message:
          "Chapa returned an invalid payment amount.",
        chapa: chapaResult,
      });
    }

    const fee = toNumber(student.fee);

    const currentPaidAmount =
      toNumber(student.paid_amount);

    const currentRemainingAmount =
      toNumber(student.remaining_amount) > 0
        ? toNumber(student.remaining_amount)
        : Math.max(
            fee - currentPaidAmount,
            0
          );

    /*
     * The initialized checkout charged the current
     * remaining balance. Never accept more than expected.
     */
    const expectedAmount =
      currentRemainingAmount > 0
        ? currentRemainingAmount
        : fee;

    const difference = Math.abs(
      verifiedAmount - expectedAmount
    );

    /*
     * Small tolerance protects against decimal formatting.
     */
    if (
      expectedAmount > 0 &&
      difference > 0.01
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

    const newPaidAmount = Math.min(
      currentPaidAmount + verifiedAmount,
      fee > 0
        ? fee
        : currentPaidAmount + verifiedAmount
    );

    const newRemainingAmount =
      fee > 0
        ? Math.max(fee - newPaidAmount, 0)
        : 0;

    const newPaymentStatus =
      newRemainingAmount <= 0
        ? "Paid"
        : "Partial";

    const paidAt =
      cleanText(transaction?.updated_at) ||
      cleanText(transaction?.created_at) ||
      new Date().toISOString();

    const paymentMethod =
      cleanText(transaction?.method) ||
      cleanText(
        transaction?.payment_method
      ) ||
      "Chapa";

    /*
     * Insert the transaction first.
     * The note and transaction lookup prevent duplicates.
     */
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
          note:
            `Chapa verified payment: ${txRef}`,
        });

      if (transactionInsertError) {
        console.error(
          "Transaction insert failed:",
          transactionInsertError
        );

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
      console.error(
        "Student payment update failed:",
        updateError
      );

      return jsonResponse({
        success: false,
        verified: true,
        message:
          "Payment was verified, but the student record could not be updated: " +
          updateError.message,
      });
    }

    console.log(
      "Chapa payment verified successfully:",
      JSON.stringify({
        student_id: student.student_id,
        tx_ref: txRef,
        verified_amount: verifiedAmount,
        paid_amount: newPaidAmount,
        remaining_amount:
          newRemainingAmount,
        payment_status:
          newPaymentStatus,
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
        status: paymentStatus,
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
