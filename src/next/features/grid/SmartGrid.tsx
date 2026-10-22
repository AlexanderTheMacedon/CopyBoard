import { usePreview } from '../../app/context';
import type { Item } from '../../domain/types';
import { ItemTile } from './ItemTile';

/**
 * Ordered grid without masonry (D-005); list mode reuses the same tiles and order (D-023).
 * The list is keyed by view and density so a presentation change replays the "settle into the grid" reveal (M-12);
 * item IDs and order are untouched by that remount.
 */
export function SmartGrid({ items, label }: { items: readonly Item[]; label: string }) {
  const { state } = usePreview();
  const { view, density } = state.prefs;
  return (
    <ul key={`${view}-${density}`} className="cb-grid" data-view={view} data-density={density} aria-label={label}>
      {items.map((item, index) => (
        <ItemTile key={item.id} item={item} index={index} showSpace={state.location.type === 'collection'} />
      ))}
    </ul>
  );
}
