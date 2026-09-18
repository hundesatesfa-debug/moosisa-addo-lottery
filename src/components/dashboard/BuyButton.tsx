"use client";

import { useState, useTransition } from "react";
import { Ticket, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useLocale } from "@/i18n/client";
import { t } from "@/i18n/config";
import { formatETB } from "@/lib/utils";

export function BuyButton({
  lotteryId,
  price,
  title,
  maxTicketNumber = 300,
  availableNumbers,
}: {
  lotteryId: string;
  price: number;
  title: string;
  maxTicketNumber?: number;
  availableNumbers?: number[] | null;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [chosen, setChosen] = useState<number | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const { dict } = useLocale();

  const takenSet = new Set(availableNumbers ?? []);
  const freeCount = Math.max(0, maxTicketNumber - takenSet.size);

  function purchase() {
    setConfirmOpen(false);
    startTransition(async () => {
      try {
        const mod = await import("@/app/actions/lottery");
        const form = new FormData();
        form.set("lottery_id", lotteryId);
        if (chosen != null) form.set("chosen_number", String(chosen));
        const res = await mod.purchaseTicketAction(form);
        setDone(res.ticket.ticket_code);
        toast(
          "success",
          dict.buy.successTitle,
          t(dict.buy.yourNumber, {
            number: chosen != null ? String(chosen) : "",
            code: res.ticket.ticket_code,
          }),
        );
      } catch (e) {
        toast("error", dict.buy.failedTitle, (e as Error).message);
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
        {t(dict.buy.buyTicket, { price: formatETB(price) })}
      </Button>

      {done && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {t(dict.buy.yourNumber, {
            number: chosen != null ? String(chosen) : "",
            code: done,
          })}
        </div>
      )}

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">{dict.buy.pickNumberTitle}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {t(dict.buy.pickNumberHint, { max: String(maxTicketNumber) })}
            </p>

            <div className="mt-4 max-h-56 overflow-y-auto rounded-xl border border-slate-200 p-3">
              <div className="grid grid-cols-6 gap-1.5">
                {Array.from({ length: maxTicketNumber }, (_, i) => i + 1).map((n) => {
                  const taken = takenSet.has(n);
                  const active = chosen === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      disabled={taken}
                      onClick={() => setChosen(taken ? null : n)}
                      className={`flex h-9 w-full items-center justify-center rounded-lg text-sm font-semibold transition
                        ${
                          taken
                            ? "cursor-not-allowed bg-slate-100 text-slate-400 line-through"
                            : active
                              ? "bg-brand-600 text-white shadow"
                              : "bg-slate-50 text-slate-700 hover:bg-brand-50"
                        }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="mt-3 text-center text-xs font-medium text-slate-500">
              {t(dict.buy.numbersLeft, { count: String(freeCount) })}
            </p>

            <div className="mt-4 rounded-xl bg-brand-50 p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
                {dict.buy.total}
              </p>
              <p className="text-2xl font-extrabold text-brand-700">
                {formatETB(price)}
              </p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                {dict.buy.cancel}
              </Button>
              <Button variant="gold" onClick={purchase} disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {dict.buy.confirm}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
</content>
