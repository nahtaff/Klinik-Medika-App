export function Skeleton({
  count = 3,
  itemClassName = "h-20",
  label,
}: {
  count?: number;
  itemClassName?: string;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label={label}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`animate-pulse rounded-2xl bg-foreground/5 ${itemClassName}`}
        />
      ))}
    </div>
  );
}

export function ErrorState({
  message = "Gagal memuat data. Periksa koneksi internet Anda.",
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-6 text-center"
    >
      <p className="text-sm text-red-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Coba lagi
      </button>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-white p-6 text-center text-sm text-foreground/60">
      {message}
    </div>
  );
}
