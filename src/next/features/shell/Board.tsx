import type { RefObject } from 'react';
import { usePreview } from '../../app/context';
import type { Item, ItemKind } from '../../domain/types';
import { SmartCapture } from '../capture/SmartCapture';
import { EmptyState } from '../grid/EmptyState';
import { SmartGrid } from '../grid/SmartGrid';
import { ViewControls } from '../grid/ViewControls';
import { formatDate, kindIcon, kindLabel } from '../items/item-meta';
import { WorkspaceHeader, type HeaderFact } from './WorkspaceHeader';

const kindOrder: readonly ItemKind[] = ['text', 'markdown', 'code', 'image', 'file', 'audio'];

/** Small informational facts for the hero: per-type counts, favourites and the latest change. */
function boardFacts(items: readonly Item[]): HeaderFact[] {
  if (!items.length) return [];
  const facts: HeaderFact[] = [];
  for (const kind of kindOrder) {
    const n = items.filter((i) => i.kind === kind).length;
    if (n) facts.push({ icon: kindIcon[kind], label: `${n} ${kindLabel[kind]}` });
  }
  const favorites = items.filter((i) => i.favorite).length;
  if (favorites) facts.push({ icon: 'star', label: `${favorites} ${favorites === 1 ? 'Favorit' : 'Favoriten'}` });
  const latest = items.reduce((max, i) => (i.updatedAt > max ? i.updatedAt : max), items[0]?.updatedAt ?? '');
  if (latest) facts.push({ icon: 'clock', label: `Zuletzt ${formatDate(latest)}` });
  return facts;
}

/** Space board / collection view (SC-02, SC-04..07): Ambient header → Smart Capture → Smart Grid. */
export function Board({ scrollRoot }: { scrollRoot: RefObject<HTMLElement | null> }) {
  const { state, library } = usePreview();
  const { location } = state;
  const items = library.listItems(location);

  const space = location.type === 'space' ? library.getSpace(location.spaceId) : undefined;
  const collection = location.type === 'collection' ? library.collections.find((c) => c.id === location.collectionId) : undefined;
  const title = space?.name ?? collection?.name ?? '';
  const description = space?.description ?? (collection?.available ? 'Globale Ansicht über alle Spaces.' : 'Diese Ansicht ist in der Vorschau noch leer.');

  const emptyVariant = collection && !collection.available ? 'unavailable' : space ? 'space-empty' : 'collection-empty';
  const countLabel = items.length === 1 ? '1 Inhalt' : `${items.length} Inhalte`;

  return (
    <>
      <WorkspaceHeader
        eyebrow={space ? 'Space' : 'Schnellzugriff'}
        title={title}
        description={description}
        facts={boardFacts(items)}
        countLabel={items.length ? countLabel : undefined}
        scrollRoot={scrollRoot}
      />
      <div className="cb-board">
        <SmartCapture />
        {items.length > 0 ? (
          <>
            <ViewControls count={items.length} />
            <SmartGrid items={items} label={`Inhalte in ${title}`} />
          </>
        ) : (
          <EmptyState variant={emptyVariant} />
        )}
      </div>
    </>
  );
}
