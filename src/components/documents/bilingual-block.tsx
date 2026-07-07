export function Bilingual({ id, ko, className }: { id: string; ko: string; className?: string }) {
  return (
    <span className={className}>
      <span className="block">{id}</span>
      <span className="block text-xs text-muted-foreground">{ko}</span>
    </span>
  );
}
