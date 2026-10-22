import type { CSSProperties } from 'react';
import { usePreview } from '../../app/context';
import { Icon } from '../../components/Icon';
import { IconButton } from '../../components/IconButton';
import type { Item } from '../../domain/types';
import { primaryQuickAction } from '../items/item-actions';
import { formatDate, kindIcon, kindLabel, spaceColorVar } from '../items/item-meta';
import { useRunItemAction } from '../items/useItemActions';
import { ItemPreview } from './ItemPreview';

export const tileOpenButtonId = (itemId: string) => `cb-tile-open-${itemId}`;

/**
 * One item in the Smart Grid or List (DS-C09/C10): identical action grammar in both layouts, only CSS differs.
 * The main button opens the Inspector; the quick action is a sibling, so there are no nested interactive elements.
 */
export function ItemTile({ item, showSpace }: { item: Item; showSpace: boolean }) {
  const { state, dispatch, library } = usePreview();
  const runAction = useRunItemAction();
  const selected = state.inspectedItemId === item.id;
  const quick = primaryQuickAction(item, state.location);
  const space = library.getSpace(item.spaceId);

  return (
    <li className="cb-tile" data-kind={item.kind} data-selected={selected || undefined} data-item-id={item.id}>
      <button
        id={tileOpenButtonId(item.id)}
        type="button"
        className="cb-tile__open"
        aria-current={selected ? 'true' : undefined}
        onClick={() => dispatch({ type: 'inspect', itemId: item.id })}
      >
        <span className="cb-tile__preview">
          <ItemPreview item={item} />
        </span>
        <span className="cb-tile__body">
          <span className="cb-tile__title">{item.title}</span>
          <span className="cb-tile__meta">
            <Icon name={kindIcon[item.kind]} size={14} />
            <span>{kindLabel[item.kind]}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={item.updatedAt}>{formatDate(item.updatedAt)}</time>
            {showSpace && space && (
              <span className="cb-space-chip" style={{ '--cb-chip': spaceColorVar(space.color) } as CSSProperties}>
                {space.name}
              </span>
            )}
            {item.favorite && (
              <span className="cb-tile__favorite" title="Favorit">
                <Icon name="star" size={14} />
                <span className="cb-visually-hidden">Favorit</span>
              </span>
            )}
          </span>
        </span>
      </button>
      {quick && (
        <div className="cb-tile__actions">
          <IconButton
            icon={quick.icon}
            size="sm"
            variant="subtle"
            label={`${item.title}: ${quick.label} (Demo)`}
            onClick={() => runAction(quick, item)}
          />
        </div>
      )}
    </li>
  );
}
