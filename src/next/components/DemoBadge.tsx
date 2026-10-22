/** Marks a control or area as demo/not yet available (Run B contract: no simulated success). */
export function DemoBadge({ children = 'Demo' }: { children?: string }) {
  return <span className="cb-demo-badge">{children}</span>;
}
