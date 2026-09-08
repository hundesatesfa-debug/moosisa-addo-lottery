"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { initiatePayment } from "@/lib/payment";
import { getServerDict, localizedPath } from "@/i18n/server";
import type { Dictionary } from "@/i18n/config";

function requireOne(
  v: FormDataEntryValue | null,
  errorMsg: string,
): string {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) throw new Error(errorMsg);
  return s;
}

// ---------------- Lottery management (admin) ----------------

export async function createLotteryAction(formData: FormData) {
  const profile = await getProfile();
  const { dict } = await getServerDict();
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    throw new Error("FORBIDDEN");
  }

  const title = requireOne(formData.get("title"), dict.errors.allFieldsRequired);
  const description = (formData.get("description") as string)?.trim() ?? null;
  const ticketPrice = Number(formData.get("ticket_price")) || 300;
  const registrationStart = requireOne(formData.get("registration_start"), dict.errors.allFieldsRequired);
  const registrationEnd = requireOne(formData.get("registration_end"), dict.errors.allFieldsRequired);
  const drawDate = requireOne(formData.get("draw_date"), dict.errors.allFieldsRequired);

  if (new Date(registrationEnd) < new Date(registrationStart)) {
    throw new Error(dict.errors.regCloseAfterStart);
  }
  if (new Date(drawDate) < new Date(registrationEnd)) {
    throw new Error(dict.errors.drawAfterRegClose);
  }
  if (ticketPrice <= 0) throw new Error(dict.errors.ticketPricePositive);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lotteries")
    .insert({
      title,
      description,
      ticket_price: ticketPrice,
      registration_start: registrationStart,
      registration_end: registrationEnd,
      draw_date: drawDate,
      status: "upcoming",
      created_by: profile.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await createAuditLog({
    actorId: profile.id,
    action: "lottery.created",
    entityType: "lottery",
    entityId: data.id,
    metadata: { title, ticket_price: ticketPrice },
  });

  redirect(await localizedPath("/admin/lotteries"));
}

export async function updateLotteryAction(formData: FormData) {
  const profile = await getProfile();
  const { dict } = await getServerDict();
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    throw new Error("FORBIDDEN");
  }

  const id = requireOne(formData.get("id"), dict.errors.allFieldsRequired);
  const title = requireOne(formData.get("title"), dict.errors.allFieldsRequired);
  const description = (formData.get("description") as string)?.trim() ?? null;
  const ticketPrice = Number(formData.get("ticket_price")) || 300;
  const registrationStart = requireOne(formData.get("registration_start"), dict.errors.allFieldsRequired);
  const registrationEnd = requireOne(formData.get("registration_end"), dict.errors.allFieldsRequired);
  const drawDate = requireOne(formData.get("draw_date"), dict.errors.allFieldsRequired);

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("lotteries")
    .select("status")
    .eq("id", id)
    .single();

  // Cannot edit once drawn.
  if (!existing || existing.status === "completed") {
    throw new Error(dict.errors.lotteryLocked);
  }

  const { data, error } = await supabase
    .from("lotteries")
    .update({
      title,
      description,
      ticket_price: ticketPrice,
      registration_start: registrationStart,
      registration_end: registrationEnd,
      draw_date: drawDate,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await createAuditLog({
    actorId: profile.id,
    action: "lottery.updated",
    entityType: "lottery",
    entityId: data.id,
  });

  redirect(await localizedPath("/admin/lotteries"));
}

export async function openLotteryAction(formData: FormData) {
  const profile = await getProfile();
  const { dict } = await getServerDict();
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    throw new Error("FORBIDDEN");
  }
  const id = requireOne(formData.get("id"), dict.errors.allFieldsRequired);

  const supabase = await createClient();
  const { error } = await supabase
    .from("lotteries")
    .update({ status: "active" })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await createAuditLog({
    actorId: profile.id,
    action: "lottery.opened",
    entityType: "lottery",
    entityId: id,
  });
  redirect(await localizedPath("/admin/lotteries"));
}

export async function closeLotteryAction(formData: FormData) {
  const profile = await getProfile();
  const { dict } = await getServerDict();
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    throw new Error("FORBIDDEN");
  }
  const id = requireOne(formData.get("id"), dict.errors.allFieldsRequired);

  const supabase = await createClient();
  const { error } = await supabase
    .from("lotteries")
    .update({ status: "closed" })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await createAuditLog({
    actorId: profile.id,
    action: "lottery.closed",
    entityType: "lottery",
    entityId: id,
  });
  redirect(await localizedPath("/admin/lotteries"));
}

// ---------------- Ticket purchase (participant) ----------------

// Human-readable ticket code, e.g. MAAC-XXXXXX
function generateTicketCode() {
  const rand =
    Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, "X");
  return `MAAC-${rand}`;
}

export async function purchaseTicketAction(formData: FormData) {
  const profile = await getProfile();
  const { dict }: { dict: Dictionary } = await getServerDict();
  if (!profile || profile.role !== "participant") {
    throw new Error("FORBIDDEN");
  }

  const lotteryId = requireOne(formData.get("lottery_id"), dict.errors.allFieldsRequired);
  const supabase = await createClient();

  const { data: lottery } = await supabase
    .from("lotteries")
    .select("*")
    .eq("id", lotteryId)
    .single();

  if (!lottery) throw new Error(dict.errors.lotteryNotFound);
  if (lottery.status !== "active" && lottery.status !== "upcoming") {
    throw new Error(dict.errors.notAcceptingTickets);
  }

  // DB unique constraint (tickets_one_per_user_per_lottery) prevents dupes.
  const { data: ticket, error: tErr } = await supabase
    .from("tickets")
    .insert({
      ticket_code: generateTicketCode(),
      user_id: profile.id,
      lottery_id: lotteryId,
      price_paid: lottery.ticket_price,
      payment_status: "pending",
    })
    .select()
    .single();

  if (tErr) {
    if (tErr.code === "23505") {
      throw new Error(dict.errors.alreadyHaveTicket);
    }
    throw new Error(tErr.message);
  }

  // Create the payment record via the abstraction (manual or Chapa).
  const payment = await initiatePayment({
    ticketId: ticket.id,
    userId: profile.id,
    amount: Number(lottery.ticket_price),
    lotteryTitle: lottery.title,
  });

  return { ticket, payment };
}

// ---------------- Payment management (admin) ----------------

export async function verifyTicketAction(formData: FormData) {
  const profile = await getProfile();
  const { dict } = await getServerDict();
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    throw new Error("FORBIDDEN");
  }
  const ticketId = requireOne(formData.get("ticket_id"), dict.errors.allFieldsRequired);
  const status = requireOne(formData.get("status"), dict.errors.allFieldsRequired);

  const supabase = await createClient();
  const { data: ticket } = await supabase
    .from("tickets")
    .select("lottery_id")
    .eq("id", ticketId)
    .single();
  if (!ticket) throw new Error(dict.errors.ticketNotFound);

  const { error } = await supabase
    .from("tickets")
    .update({ payment_status: status })
    .eq("id", ticketId);
  if (error) throw new Error(error.message);

  await createAuditLog({
    actorId: profile.id,
    action: status === "verified" ? "ticket.verified" : "ticket.rejected",
    entityType: "ticket",
    entityId: ticketId,
    metadata: { lottery_id: ticket.lottery_id },
  });

  redirect(await localizedPath("/admin/tickets"));
}

// ---------------- Secure draw (admin) ----------------

export interface DrawResult {
  winners: Array<{
    position: number;
    user_id: string;
    ticket_id: string;
    ticket_code: string;
    full_name: string | null;
  }>;
  eligible: number;
}

export async function performDrawAction(
  lotteryId: string,
): Promise<DrawResult> {
  const profile = await getProfile();
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    throw new Error("FORBIDDEN");
  }

  const supabase = await createClient();

  // Let RLS verify the admin role + call the atomic DB function.
  const { data, error } = await supabase.rpc("perform_draw_authorized", {
    p_lottery_id: lotteryId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const winners = (data ?? []) as DrawResult["winners"];

  await createAuditLog({
    actorId: profile.id,
    action: "draw.started",
    entityType: "lottery",
    entityId: lotteryId,
    metadata: { winner_count: winners.length },
  });

  return { winners, eligible: winners.length };
}