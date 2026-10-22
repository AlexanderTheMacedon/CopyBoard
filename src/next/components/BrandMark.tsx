/** CopyBoard brand mark: two stacked sheets on a lavender→iris squircle (inline SVG, no asset request). */
export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <span className="cb-brand-mark" style={{ width: size, height: size }} aria-hidden="true">
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none" focusable="false">
        <rect x="8" y="3" width="12" height="15" rx="3.5" fill="#fff" fillOpacity="0.45" />
        <rect x="4" y="6.5" width="12" height="15" rx="3.5" fill="#fff" />
      </svg>
    </span>
  );
}
