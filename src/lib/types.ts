export type UserRole = "participant" | "admin" | "super_admin";

export type AccountStatus = "active" | "suspended";

export type LotteryStatus =
  | "upcoming"
  | "active"
  | "closed"
  | "drawing"
  | "completed";

export type PaymentStatus = "pending" | "verified" | "rejected";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  account_status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface Lottery {
  id: string;
  title: string;
  description: string | null;
  ticket_price: number;
  max_ticket_number: number;
  registration_start: string;
  registration_end: string;
  draw_date: string;
  status: LotteryStatus;
  max_ticket_number: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  ticket_code: string;
  chosen_number: number | null;
  user_id: string;
  lottery_id: string;
  price_paid: number;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  ticket_id: string;
  user_id: string;
  amount: number;
  currency: string;
  provider: string;
  transaction_reference: string | null;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export interface Winner {
  id: string;
  lottery_id: string;
  user_id: string;
  ticket_id: string;
  position: number;
  selected_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}
