import type { CSSProperties } from 'react';
import { usePreview } from '../../app/context';
import { Icon, type IconName } from '../../components/Icon';
import type { CollectionId, Location } from '../../domain/types';
import { spaceColorVar } from '../items/item-meta';

const collectionIcon: Record<CollectionId, IconName> = {
  all: 'layers',
  favorites: 'star',
  recent: 'clock',
  sessions: 'waveform',
};

/**
 * Spaces-first navigation (D-018): "Deine Spaces" on top, quick access below. Shared by the desktop sidebar and the mobile
 * drawer, so both always show the same entries and active state.
 */
export function SpaceNav({ idPrefix }: { idPrefix: string }) {
  const { state, dispatch, library, notify } = usePreview();
  const { location } = state;
  const go = (next: Location) => dispatch({ type: 'navigate', location: next });

  return (
    <nav className="cb-nav" aria-label="Spaces und Schnellzugriff">
      <h2 className="cb-nav__heading" id={`${idPrefix}-spaces`}>
        Deine Spaces
      </h2>
      <ul className="cb-nav__list" aria-labelledby={`${idPrefix}-spaces`}>
        {library.spaces.map((space) => {
          const active = location.type === 'space' && location.spaceId === space.id;
          return (
            <li key={space.id}>
              <button
                type="button"
                className="cb-nav__item"
                aria-current={active ? 'page' : undefined}
                title={space.name}
                onClick={() => go({ type: 'space', spaceId: space.id })}
              >
                <span className="cb-nav__swatch" style={{ '--cb-swatch': spaceColorVar(space.color) } as CSSProperties} aria-hidden="true">
                  {space.name.slice(0, 1)}
                </span>
                <span className="cb-nav__label">{space.name}</span>
                <span className="cb-nav__count" aria-label={`${library.listItems({ type: 'space', spaceId: space.id }).length} Inhalte`}>
                  {library.listItems({ type: 'space', spaceId: space.id }).length}
                </span>
              </button>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            className="cb-nav__item cb-nav__item--muted"
            title="Neuer Space (Demo)"
            onClick={() => notify('Demo: Neue Spaces können in der Vorschau noch nicht angelegt werden.')}
          >
            <span className="cb-nav__icon" aria-hidden="true">
              <Icon name="plus" />
            </span>
            <span className="cb-nav__label">Neuer Space</span>
          </button>
        </li>
      </ul>

      <h2 className="cb-nav__heading" id={`${idPrefix}-quick`}>
        Schnellzugriff
      </h2>
      <ul className="cb-nav__list" aria-labelledby={`${idPrefix}-quick`}>
        {library.collections.map((collection) => {
          const active = location.type === 'collection' && location.collectionId === collection.id;
          return (
            <li key={collection.id}>
              <button
                type="button"
                className="cb-nav__item"
                aria-current={active ? 'page' : undefined}
                title={collection.name}
                onClick={() => go({ type: 'collection', collectionId: collection.id })}
              >
                <span className="cb-nav__icon" aria-hidden="true">
                  <Icon name={collectionIcon[collection.id]} />
                </span>
                <span className="cb-nav__label">{collection.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
