"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dices, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/i18n/client";
import { localizePath, t } from "@/i18n/config";

interface DrawPageProps {
  lottery: {
    id: string;
    title: string;
  };
  eligible: number;
  initialWinners: (WinnersData)[];
}

export interface WinnersData {
  position: number;
  user_id: string;
  ticket_id: string;
  ticket_code: string;
  full_name: string | null;
}

interface DrawPhase {
  step: "idle" | "confirm" | "running" | "revealing" | "done" | "error";
  winners: WinnersData[];
  error?: string;
}

export function DrawExperience({
  lottery,
  eligible,
  initialWinners,
}: DrawPageProps) {
  const router = useRouter();
  const { locale, dict } = useLocale();
  const [phase, setPhase] = useState<DrawPhase>({
    step: initialWinners.length ? "done" : "idle",
    winners: initialWinners,
  });
  const [pending, startTransition] = useTransition();

  const medals: Record<number, { icon: string; label: string }> = {
    1: { icon: "🥇", label: dict.draw.firstWinner },
    2: { icon: "🥈", label: dict.draw.secondWinner },
    3: { icon: "🥉", label: dict.draw.thirdWinner },
  };

  function runDraw() {
    setPhase({ step: "running", winners: [] });
    startTransition(async () => {
      try {
        const mod = await import("@/app/actions/lottery");
        const res = await mod.performDrawAction(lottery.id);
        // Small delay so the celebratory animation is visible; the result is
        // already final from the secure server call.
        setTimeout(() => {
          setPhase({ step: "done", winners: res.winners });
          router.refresh();
        }, 2200);
      } catch (e) {
        setPhase({
          step: "error",
          winners: [],
          error: (e as Error).message,
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Status: not drawn */}
      {phase.step === "idle" && (
        <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-violet-50 p-8 text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-brand-600" />
          <h2 className="mt-4 text-xl font-extrabold text-slate-900">
            {t(dict.draw.readyTitle, { title: lottery.title })}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {dict.draw.readyText}
          </p>
          <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-800 shadow-sm">
            <Dices className="h-5 w-5 text-brand-600" />
            {t(dict.draw.eligibleLabel, { eligible: String(eligible) })}
          </div>
          <div className="mt-6">
            <Button size="lg" onClick={() => setPhase({ step: "confirm", winners: [] })}>
              <Dices className="h-5 w-5" /> {dict.draw.startSecureDraw}
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation */}
      {phase.step === "confirm" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
            <span className="text-4xl">⚠️</span>
            <h3 className="mt-3 text-lg font-extrabold text-slate-900">
              {dict.draw.startQuestion}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              {t(dict.draw.confirmText, { eligible: String(eligible) })}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setPhase({ step: "idle", winners: [] })}>
                {dict.common.cancel}
              </Button>
              <Button variant="gold" onClick={runDraw} disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {dict.draw.yesDrawNow}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Running / selection animation */}
      {phase.step === "running" && (
        <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-700 via-brand-800 to-violet-900 p-12 text-center text-white">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-gold-400/40 animate-spin">
            <Dices className="h-9 w-9 text-gold-400" />
          </div>
          <h3 className="mt-6 text-2xl font-extrabold">{dict.draw.selecting}</h3>
          <p className="mt-2 text-sm text-brand-200">
            {dict.draw.computingText}
          </p>
          <div className="mx-auto mt-6 flex max-w-xs items-center gap-2 text-xs text-brand-200">
            <ShieldCheck className="h-4 w-4 shrink-0 text-gold-400" />
            {dict.draw.secureServerNote}
          </div>
        </div>
      )}

      {/* Done: reveal winners */}
      {phase.step === "done" && phase.winners.length > 0 && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-gradient-to-r from-gold-400 via-gold-500 to-gold-400 p-8 text-center">
            <span className="text-5xl">🏆</span>
            <h2 className="mt-3 text-2xl font-extrabold text-slate-900">
              {dict.draw.doneTitle}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-800">
              {t(dict.draw.doneSubtitle, { title: lottery.title })}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* 1st winner highlighted */}
            {[1, 2, 3].map((pos) => {
              const w = phase.winners.find((x) => x.position === pos);
              if (!w) return null;
              const m = medals[pos];
              return (
                <div
                  key={pos}
                  className={`animate-pop-in rounded-2xl border bg-white p-6 text-center shadow-lg ${
                    pos === 1
                      ? "border-gold-400 ring-4 ring-gold-300"
                      : "border-slate-200"
                  }`}
                  style={{ animationDelay: `${pos * 250}ms` }}
                >
                  <span className="text-5xl">{m.icon}</span>
                  <p className="mt-3 text-xs font-bold uppercase tracking-widest text-brand-600">
                    {m.label}
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-slate-900">
                    {w.full_name ?? dict.common.anonymous}
                  </p>
                  <p className="mt-1 font-mono text-xs text-slate-400">
                    {w.ticket_code}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <Button onClick={() => router.push(localizePath(locale, "/admin/winners"))}>
              {dict.draw.viewAllWinners}
            </Button>
          </div>
        </div>
      )}

      {/* Error */}
      {phase.step === "error" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <span className="text-4xl">😕</span>
          <h3 className="mt-3 text-lg font-bold text-slate-900">
            {dict.draw.errorTitle}
          </h3>
          <p className="mt-2 text-sm text-red-600">{phase.error}</p>
          <div className="mt-5">
            <Button variant="outline" onClick={() => setPhase({ step: "idle", winners: [] })}>
              {dict.draw.goBack}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}