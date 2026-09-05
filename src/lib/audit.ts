import { createAdminClient } from "@/lib/supabase/admin";

export type AuditAction =
  | "lottery.created"
  | "lottery.opened"
  | "lottery.closed"
  | "lottery.updated"
  | "ticket.verified"
  | "ticket.rejected"
  | "ticket.purchased"
  | "draw.started"
  | "draw.winners_selected"
  | "lottery.completed"
  | "user.role_changed"
  | "user.suspended"
  | "user.reactivated"
  | "user.created";

export async function createAuditLog(params: {
  actorId?: string | null;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  const payload = {
    actor_id: params.actorId ?? null,
    action: params.action,
    entity_type: params.entityType ?? null,
    entity_id: params.entityId ?? null,
    metadata: params.metadata ?? null,
  };

  try {
    // Prefer service role when configured (bypasses RLS for system writes).
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const { error } = await createAdminClient()
        .from("audit_logs")
        .insert(payload);
      if (!error) return;
    }

    // Fallback: authenticated admin via RLS.
    const { createClient } = await import("@/lib/supabase/server");
    const { error } = await (await createClient())
      .from("audit_logs")
      .insert(payload);
    if (error) {
      console.error("Failed to write audit log:", error.message);
    }
  } catch (e) {
    console.error("Failed to write audit log:", (e as Error).message);
  }
}
