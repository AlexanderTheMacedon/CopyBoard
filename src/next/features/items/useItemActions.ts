import { useCallback } from 'react';
import { usePreview } from '../../app/context';
import type { Item } from '../../domain/types';
import { demoMessage, type ItemAction } from './item-actions';

/** Executes a registry action. Demo actions only announce that they are unavailable; nothing is written anywhere. */
export function useRunItemAction() {
  const { dispatch, notify } = usePreview();
  return useCallback(
    (action: ItemAction, item: Item) => {
      if (action.availability === 'demo') {
        notify(demoMessage[action.id]);
        return;
      }
      switch (action.id) {
        case 'open-composer':
          dispatch({ type: 'openComposer', itemId: item.id });
          break;
        case 'reveal-in-space':
          dispatch({ type: 'navigate', location: { type: 'space', spaceId: item.spaceId } });
          dispatch({ type: 'inspect', itemId: item.id });
          break;
        case 'copy':
        case 'download':
          break;
      }
    },
    [dispatch, notify],
  );
}
