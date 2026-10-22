import { usePreview } from '../../app/context';
import type { Item } from '../../domain/types';
import { ItemTile } from './ItemTile';

/** Ordered grid without masonry (D-005); list mode reuses the same tiles and order (D-023). */
export function SmartGrid({ items, label }: { items: readonly Item[]; label: string }) {
  const { state } = usePreview();
  const { view, density } = state.prefs;
  return (
    <ul className="cb-grid" data-view={view} data-density={density} aria-label={label}>
      {items.map((item) => (
        <ItemTile key={item.id} item={item} showSpace={state.location.type === 'collection'} />
      ))}
    </ul>
  );
}
