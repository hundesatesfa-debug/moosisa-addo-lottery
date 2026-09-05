"use client";

import { useState, useTransition } from "react";
import { Ticket, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatETB } from "@/lib/utils";

export function BuyButton({
  lotteryId,
  price,
  title,
}: {
  lotteryId: string;
  price: number;
  title: string;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  function purchase() {
    setConfirmOpen(false);
    startTransition(async () => {
      try {
        const mod = await import("@/app/actions/lottery");
        const res = await mod.purchaseTicketAction(new FormData());
        // Client-boundary action returns our object; refresh view via revalidation below.
        setDone(res.ticket.ticket_code);
        toast("success", "Ticket purchased", `Your code is ${res.ticket.ticket_code}`);
      } catch (e) {
        toast("error", "Purchase failed", (e as Error).message);
      }
    });
  }

  return (
    <>
      <Button
        size="lg"
        variant="gold"
        className="w-full"
        onClick={() => setConfirmOpen(true)}
      >
        <Ticket className="h-5 w-5" />
        Buy Ticket — {formatETB(price)}
      </Button>

      {done && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-5 w-5" />
          Ticket {done} purchased. Complete payment to verify it.
        </div>
      )}

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Confirm purchase</h3>
            <p className="mt-1 text-sm text-slate-500">
              You are about to buy one ticket for <strong>{title}</strong>.
            </p>
            <div className="mt-4 rounded-xl bg-brand-50 p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
                Total
              </p>
              <p className="text-2xl font-extrabold text-brand-700">
                {formatETB(price)}
              </p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button variant="gold" onClick={purchase} disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}