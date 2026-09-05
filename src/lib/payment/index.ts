// Payment abstraction layer.
//
// This is intentionally isolated so the payment provider can change without
// touching the rest of the app. For the first version we support two
// "gateways":
//   1. "manual" - the default MVP flow. A payment row is created in "pending"
//      status and an admin verifies it manually. No external provider needed.
//   2. "chapa"  - real Ethiopian payment via Chapa (test or live keys).
//
// To switch providers, change PAYMENT_PROVIDER below. The rest of the
// application only talks to the functions in this file.

import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import type { PaymentStatus } from "@/lib/types";

export type PaymentProvider = "manual" | "chapa";

const PAYMENT_PROVIDER: PaymentProvider = (process.env
  .NEXT_PUBLIC_PAYMENT_PROVIDER as PaymentProvider) || "manual";

export function getActiveProvider(): PaymentProvider {
  return PAYMENT_PROVIDER;
}

export interface InitiatePaymentInput {
  ticketId: string;
  userId: string;
  amount: number;
  currency?: string;
  lotteryTitle: string;
  customerEmail?: string;
}

export interface InitiatePaymentResult {
  provider: PaymentProvider;
  transactionReference: string;
  checkoutUrl: string | null;
  status: PaymentStatus;
  redirectTo?: string;
}

// Create a payment record for a ticket. Abstracted so switching from manual
// to Chapa (or any other gateway) requires no change to callers.
export async function initiatePayment(
  input: InitiatePaymentInput,
): Promise<InitiatePaymentResult> {
  const supabase = await createSupabaseClient();

  const payload = {
    ticket_id: input.ticketId,
    user_id: input.userId,
    amount: input.amount,
    currency: input.currency ?? "ETB",
    provider: PAYMENT_PROVIDER,
    transaction_reference: generateReference(),
    status: "pending" as PaymentStatus,
  };

  const { data, error } = await supabase
    .from("payments")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Failed to create payment");

  if (PAYMENT_PROVIDER === "chapa") {
    return chapaInitiate(input, data.transaction_reference);
  }

  // Manual gateway: no external checkout; admin verifies payment.
  return {
    provider: "manual",
    transactionReference: data.transaction_reference,
    checkoutUrl: null,
    status: "pending",
    redirectTo: "/participant/tickets",
  };
}

function generateReference(): string {
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `TRX-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

// ---------------- Chapa integration ----------------

const CHAPA_API = "https://api.chapa.co/v1";

async function chapaInitiate(
  input: InitiatePaymentInput,
  transactionReference: string,
): Promise<InitiatePaymentResult> {
  const secret = process.env.CHAPA_SECRET_KEY;
  if (!secret) throw new Error("CHAPA_SECRET_KEY is not configured");

  const body: Record<string, unknown> = {
    amount: String(input.amount),
    currency: input.currency ?? "ETB",
    email: input.customerEmail ?? "customer@example.com",
    first_name: input.customerEmail?.split("@")[0] ?? "Customer",
    last_name: "",
    tx_ref: transactionReference,
    callback_url: `${getAppUrl()}/api/payments/chapa/webhook`,
    return_url: `${getAppUrl()}/participant/tickets`,
    "customization[title]": input.lotteryTitle,
    "customization[description]": "Lottery ticket",
  };

  const res = await fetch(`${CHAPA_API}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.status !== "success") {
    // Fall back gracefully: keep the payment pending so an admin can still
    // verify it manually if Chapa is misconfigured or fails.
    return {
      provider: "chapa",
      transactionReference,
      checkoutUrl: null,
      status: "pending",
    };
  }

  return {
    provider: "chapa",
    transactionReference,
    checkoutUrl: json.data?.checkout_url ?? null,
    status: "pending",
    redirectTo: json.data?.checkout_url,
  };
}

function getAppUrl(): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
