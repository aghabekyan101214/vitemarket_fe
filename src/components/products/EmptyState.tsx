export function EmptyState({ message }: { message: string }) {
  return (
    <div role="status" className="rounded-site border border-dashed border-border bg-secondary/50 px-6 py-16 text-center text-foreground/80">
      {message}
    </div>
  );
}
