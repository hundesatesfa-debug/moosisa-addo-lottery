import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getProfile } from "@/lib/auth";
import { SiteNav } from "@/components/SiteNav";
import { Footer } from "@/components/Footer";
import { Countdown } from "@/components/Countdown";
import { Button } from "@/components/ui/Button";
import {
  Ticket,
  ShieldCheck,
  Trophy,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Users,
  Eye,
  Lock,
} from "lucide-react";
import { formatETB, formatDate } from "@/lib/utils";
import { getDictionary, getLocaleFromValue, localizePath } from "@/i18n/config";
import { t } from "@/i18n/config";

export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string }>;
};

async function getHomeData() {
  const notConfigured = !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes(
    "placeholder",
  );

  if (!notConfigured) {
    return { authed: false, role: null, lottery: null, winners: null };
  }

  try {
    const supabase = await createClient();
    const [user, profile] = await Promise.all([getCurrentUser(), getProfile()]);

    const { data: lottery } = await supabase
      .from("lotteries")
      .select("*")
      .not("status", "eq", "draft")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const { data: winners } = await supabase
      .from("winners")
      .select(
        "position, selected_at, profiles(full_name), tickets(ticket_code), lotteries(title)",
      );

    return {
      authed: !!user,
      role: profile?.role ?? null,
      lottery,
      winners,
    };
  } catch {
    return { authed: false, role: null, lottery: null, winners: null };
  }
}

export default async function HomePage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = getLocaleFromValue(rawLocale);
  const dict = getDictionary(locale);

  const { authed, role, lottery, winners } = await getHomeData();
  const dashboardHref =
    role === "admin" || role === "super_admin"
      ? localizePath(locale, "/admin")
      : localizePath(locale, "/participant");

  const isActive =
    lottery?.status === "active" ||
    lottery?.status === "upcoming" ||
    lottery?.status === "drawing";

  const prizeMeta: Record<
    number,
    { medal: string; label: string; ring: string }
  > = {
    1: { medal: "🥇", label: dict.home.prize1, ring: "ring-amber-300" },
    2: { medal: "🥈", label: dict.home.prize2, ring: "ring-slate-300" },
    3: { medal: "🥉", label: dict.home.prize3, ring: "ring-orange-300" },
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteNav authed={authed} role={role} />

      {/* HERO */}
      <section className="relative overflow-hidden bg-slate-950">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-brand-600/30 blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-violet-600/30 blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 h-[300px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500/10 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-fade-in">
              <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold-300">
                <Sparkles className="h-3.5 w-3.5" />
                {dict.home.badge}
              </span>
              <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Mosisaa <span className="text-gradient-gold">Addunyaa</span>{" "}
                Abbaa Carraa
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
                {dict.home.taglineOne}{" "}
                <strong className="text-white">{dict.home.taglinePrice}</strong>{" "}
                {dict.home.tagline}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                {authed ? (
                  <Link href={dashboardHref}>
                    <Button size="lg" variant="gold" className="w-full sm:w-auto">
                      {dict.home.goToDashboard} <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Link href={localizePath(locale, "/auth/signup")}>
                    <Button size="lg" variant="gold" className="w-full sm:w-auto">
                      {dict.home.claimYourChance} <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                <Link href="#how-it-works">
                  <Button size="lg" variant="outline" className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10 sm:w-auto">
                    {dict.home.howItWorks}
                  </Button>
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
                {[
                  { icon: ShieldCheck, label: dict.home.featureVerified },
                  { icon: Eye, label: dict.home.featureTransparent },
                  { icon: Lock, label: dict.home.featureFair },
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-2 text-sm text-slate-300">
                    <f.icon className="h-4 w-4 text-gold-400" />
                    {f.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Current lottery card */}
            <div className="animate-fade-in">
              {lottery && isActive ? (
                <div className="mx-auto max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                      {lottery.status === "upcoming"
                        ? dict.home.comingSoon
                        : dict.home.registrationOpen}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      {t(dict.home.drawLabel, { date: formatDate(lottery.draw_date) })}
                    </span>
                  </div>
                  <h3 className="mt-4 text-2xl font-extrabold text-white">
                    {lottery.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-300">
                    {lottery.description}
                  </p>
                  <div className="mt-6 flex items-end justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {dict.home.ticketPrice}
                      </p>
                      <p className="text-3xl font-extrabold text-gradient-gold">
                        {formatETB(lottery.ticket_price)}
                      </p>
                    </div>
                    <div className="flex gap-1.5" aria-label={t(dict.home.winnersCount, {})}>
                      <Trophy className="mr-1 h-5 w-5 self-center text-gold-400" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                    <span>{t(dict.home.closingLabel, { date: formatDate(lottery.registration_end) })}</span>
                    <span>{dict.home.winnersCount}</span>
                  </div>
                  <div className="mt-6">
                    <Countdown target={lottery.draw_date} />
                  </div>
                  <Link
                    href={authed ? localizePath(locale, "/participant") : localizePath(locale, "/auth/signup")}
                    className="mt-8 block"
                  >
                    <Button variant="gold" size="lg" className="w-full">
                      <Ticket className="h-5 w-5" />
                      {t(dict.home.buyTicket, { price: formatETB(lottery.ticket_price) })}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
                  <Trophy className="mx-auto h-12 w-12 text-gold-400" />
                  <h3 className="mt-4 text-xl font-extrabold text-white">
                    {dict.home.newRoundTitle}
                  </h3>
                  <p className="mt-2 text-sm text-slate-300">
                    {dict.home.newRoundText}
                  </p>
                  <Link href={localizePath(locale, "/auth/signup")} className="mt-6 inline-block">
                    <Button size="lg" variant="gold">
                      {dict.home.getNotified} <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-600">
            {dict.home.howItWorksKicker}
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {dict.home.howItWorksTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            {dict.home.howItWorksSubtitle}
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { icon: Users, step: "01", title: dict.home.step1Title, text: dict.home.step1Text },
            { icon: Ticket, step: "02", title: dict.home.step2Title, text: dict.home.step2Text },
            { icon: Trophy, step: "03", title: dict.home.step3Title, text: dict.home.step3Text },
          ].map((s) => (
            <div
              key={s.step}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <s.icon className="h-6 w-6" />
                </span>
                <span className="font-display text-4xl font-extrabold text-slate-100">
                  {s.step}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* THREE WINNERS band */}
      <section className="border-y border-slate-200 bg-gradient-to-br from-brand-900 via-brand-800 to-violet-900 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="space-y-3 text-center md:text-left">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold-300">
                <Trophy className="h-4 w-4" /> {dict.home.bandKicker}
              </span>
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                {dict.home.bandTitle}
              </h2>
              <div className="flex justify-center gap-4 pt-2 md:justify-start">
                {["🥇", "🥈", "🥉"].map((m, i) => (
                  <div
                    key={i}
                    className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-4xl backdrop-blur"
                  >
                    {m}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {[
                { title: dict.home.band1Title, text: dict.home.band1Text },
                { title: dict.home.band2Title, text: dict.home.band2Text },
                { title: dict.home.band3Title, text: dict.home.band3Text },
              ].map((f) => (
                <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <h3 className="flex items-center gap-2 font-bold text-white">
                    <ShieldCheck className="h-4 w-4 text-gold-400" /> {f.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-300">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WINNERS */}
      <section id="winners" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-600">
            {dict.home.winnersKicker}
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {dict.home.winnersTitle}
          </h2>
        </div>

        {winners && winners.length > 0 ? (
          <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((pos) => {
              const w = winners.find((x) => x.position === pos);
              if (!w) return null;
              const meta = prizeMeta[pos];
              const name = (w.profiles as unknown as { full_name?: string } | null)
                ?.full_name;
              return (
                <div
                  key={pos}
                  className={`rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm ring-4 ${meta.ring}`}
                >
                  <span className="text-4xl">{meta.medal}</span>
                  <p className="mt-2 text-xs font-bold uppercase tracking-widest text-brand-600">
                    {meta.label}
                  </p>
                  <p className="mt-1 truncate text-lg font-bold text-slate-900">
                    {name ?? dict.common.anonymous}
                  </p>
                  <p className="text-xs text-slate-400">
                    {(w.lotteries as unknown as { title?: string } | null)?.title ??
                      dict.common.unknown}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mx-auto mt-8 max-w-md text-center text-sm text-slate-400">
            {dict.home.winnersEmpty}
          </p>
        )}
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-violet-700 p-8 text-center shadow-xl sm:p-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.25),transparent_50%)]" />
          <h2 className="relative text-2xl font-extrabold text-white sm:text-3xl">
            {dict.home.ctaTitle}
          </h2>
          <p className="relative mx-auto mt-2 max-w-md text-sm text-brand-100">
            {dict.home.ctaText}
          </p>
          <div className="relative mt-6">
            {authed ? (
              <Link href={dashboardHref}>
                <Button size="lg" variant="gold">
                  {dict.home.enterNextDraw} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href={localizePath(locale, "/auth/signup")}>
                <Button size="lg" variant="gold">
                  {dict.home.createFreeAccount} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600">
              {dict.home.faqKicker}
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {dict.home.faqTitle}
            </h2>
          </div>
          <div className="mt-10 space-y-3">
            {dict.home.faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 open:bg-white"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-slate-900">
                  <span className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 shrink-0 text-brand-600" />
                    {f.q}
                  </span>
                  <span className="text-xl text-slate-400 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 pl-6 text-sm leading-relaxed text-slate-500">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}