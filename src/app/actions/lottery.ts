"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { initiatePayment } from "@/lib/payment";

function requireOne(v: FormDataEntryValue | null): string {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) throw new Error("All fields are required.");
  return s;
}

// ---------------- Lottery management (admin) ----------------

export async function createLotteryAction(formData: FormData) {
  const profile = await getProfile();
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    throw new Error("FORBIDDEN");
  }

  const title = requireOne(formData.get("title"));
  const description = (formData.get("description") as string)?.trim() ?? null;
  const ticketPrice = Number(formData.get("ticket_price")) || 300;
  const registrationStart = requireOne(formData.get("registration_start"));
  const registrationEnd = requireOne(formData.get("registration_end"));
  const drawDate = requireOne(formData.get("draw_date"));

  if (new Date(registrationEnd) < new Date(registrationStart)) {
    throw new Error("Registration close must be after the start.");
  }
  if (new Date(drawDate) < new Date(registrationEnd)) {
    throw new Error("Draw date must be after registration closes.");
  }
  if (ticketPrice <= 0) throw new Error("Ticket price must be positive.");

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

  redirect("/admin/lotteries");
}

export async function updateLotteryAction(formData: FormData) {
  const profile = await getProfile();
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    throw new Error("FORBIDDEN");
  }

  const id = requireOne(formData.get("id"));
  const title = requireOne(formData.get("title"));
  const description = (formData.get("description") as string)?.trim() ?? null;
  const ticketPrice = Number(formData.get("ticket_price")) || 300;
  const registrationStart = requireOne(formData.get("registration_start"));
  const registrationEnd = requireOne(formData.get("registration_end"));
  const drawDate = requireOne(formData.get("draw_date"));

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("lotteries")
    .select("status")
    .eq("id", id)
    .single();

  // Cannot edit once drawn.
  if (!existing || existing.status === "completed") {
    throw new Error("This lottery is completed and can no longer be edited.");
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

  redirect("/admin/lotteries");
}

export async function openLotteryAction(formData: FormData) {
  const profile = await getProfile();
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    throw new Error("FORBIDDEN");
  }
  const id = requireOne(formData.get("id"));

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
  redirect("/admin/lotteries");
}

export async function closeLotteryAction(formData: FormData) {
  const profile = await getProfile();
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    throw new Error("FORBIDDEN");
  }
  const id = requireOne(formData.get("id"));

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
  redirect("/admin/lotteries");
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
  if (!profile || profile.role !== "participant") {
    throw new Error("FORBIDDEN");
  }

  const lotteryId = requireOne(formData.get("lottery_id"));
  const supabase = await createClient();

  const { data: lottery } = await supabase
    .from("lotteries")
    .select("*")
    .eq("id", lotteryId)
    .single();

  if (!lottery) throw new Error("Lottery not found.");
  if (lottery.status !== "active" && lottery.status !== "upcoming") {
    throw new Error("This lottery is not accepting tickets.");
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
      throw new Error("You already have a ticket for this lottery.");
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
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    throw new Error("FORBIDDEN");
  }
  const ticketId = requireOne(formData.get("ticket_id"));
  const status = requireOne(formData.get("status"));

  const supabase = await createClient();
  const { data: ticket } = await supabase
    .from("tickets")
    .select("lottery_id")
    .eq("id", ticketId)
    .single();
  if (!ticket) throw new Error("Ticket not found.");

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

  redirect("/admin/tickets");
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
