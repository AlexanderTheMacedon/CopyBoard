import type { RefObject } from 'react';
import { usePreview } from '../../app/context';
import { SmartCapture } from '../capture/SmartCapture';
import { EmptyState } from '../grid/EmptyState';
import { SmartGrid } from '../grid/SmartGrid';
import { ViewControls } from '../grid/ViewControls';
import { WorkspaceHeader } from './WorkspaceHeader';

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

  return (
    <>
      <WorkspaceHeader eyebrow={space ? 'Space' : 'Schnellzugriff'} title={title} description={description} scrollRoot={scrollRoot} />
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
