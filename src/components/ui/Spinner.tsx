import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
    />
  );
}

export function PageSpinner({
  label = "Loading...",
}: {
  label?: string;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
      <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}