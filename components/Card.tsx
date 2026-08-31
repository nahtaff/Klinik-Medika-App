export function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-foreground/10 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </span>
        <h3 className="font-heading text-sm font-semibold text-foreground">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}
