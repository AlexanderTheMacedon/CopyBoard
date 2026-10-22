import type { Collection, Item, ItemId, Location, Space, SpaceId } from './types';

/**
 * Read-only data boundary of the preview (ADR-007 §4): UI components only see this interface.
 * Run B implements it with synthetic fixtures; a later, separately approved adapter may implement it against real data.
 * There is intentionally no write method.
 */
export interface ReadOnlyLibrary {
  readonly spaces: readonly Space[];
  readonly collections: readonly Collection[];
  getSpace(id: SpaceId): Space | undefined;
  getItem(id: ItemId): Item | undefined;
  /** Items of a space or collection in their stable display order (identical for grid and list, D-023). */
  listItems(location: Location): readonly Item[];
  /** Every item across all spaces, in display order. */
  allItems(): readonly Item[];
}

const RECENT_LIMIT = 8;

export function createLibrary(spaces: readonly Space[], items: readonly Item[], collections: readonly Collection[]): ReadOnlyLibrary {
  const spaceById = new Map(spaces.map((s) => [s.id, s]));
  const itemById = new Map(items.map((i) => [i.id, i]));

  const byCollection = (id: Collection['id']): readonly Item[] => {
    switch (id) {
      case 'all':
        return items;
      case 'favorites':
        return items.filter((i) => i.favorite);
      case 'recent':
        return [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, RECENT_LIMIT);
      case 'sessions':
        return [];
    }
  };

  return {
    spaces,
    collections,
    getSpace: (id) => spaceById.get(id),
    getItem: (id) => itemById.get(id),
    listItems: (location) =>
      location.type === 'space' ? items.filter((i) => i.spaceId === location.spaceId) : byCollection(location.collectionId),
    allItems: () => items,
  };
}
