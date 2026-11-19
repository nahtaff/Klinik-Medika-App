export function Card({
  title,
  icon,
  children,
  headingLevel = 3,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  // 2 when the card sits right under the page h1 (FAQ), so levels don't skip
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <section className="rounded-2xl border border-foreground/10 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </span>
        <Heading className="font-heading text-sm font-semibold text-foreground">
          {title}
        </Heading>
      </div>
      {children}
    </section>
  );
}
