import type { IconName } from '../../components/Icon';
import { isTextual, type Item, type Location } from '../../domain/types';

// One action registry for card quick actions, Inspector and (later) context/ellipsis menus (D-006: same logical palette).

export type ItemActionId = 'copy' | 'download' | 'open-composer' | 'reveal-in-space';

export interface ItemAction {
  readonly id: ItemActionId;
  readonly label: string;
  readonly icon: IconName;
  /** `demo` = visible for the target layout, but intentionally without effect in the read-only preview. */
  readonly availability: 'available' | 'demo';
}

export function itemActions(item: Item, location: Location): ItemAction[] {
  const actions: ItemAction[] = [];
  // Copy stays a one-click core action for copyable types; binaries get a separate download (D-006).
  if (isTextual(item) || item.kind === 'image') actions.push({ id: 'copy', label: 'Kopieren', icon: 'copy', availability: 'demo' });
  if (item.kind === 'file' || item.kind === 'audio' || item.kind === 'image')
    actions.push({ id: 'download', label: 'Herunterladen', icon: 'download', availability: 'demo' });
  if (isTextual(item)) actions.push({ id: 'open-composer', label: 'Im Composer öffnen', icon: 'pen', availability: 'available' });
  if (location.type !== 'space' || location.spaceId !== item.spaceId)
    actions.push({ id: 'reveal-in-space', label: 'Im Space anzeigen', icon: 'arrowUpRight', availability: 'available' });
  return actions;
}

/** The single quick action shown on a card (hover/focus on desktop, always visible on touch). */
export const primaryQuickAction = (item: Item, location: Location): ItemAction | undefined =>
  itemActions(item, location).find((a) => a.id === 'copy' || a.id === 'download');

export const demoMessage: Record<ItemActionId, string> = {
  copy: 'Demo: Kopieren ist in der Vorschau nicht verfügbar. Die Zwischenablage wurde nicht verändert.',
  download: 'Demo: Herunterladen ist in der Vorschau nicht verfügbar. Es wurde keine Datei erzeugt.',
  'open-composer': '',
  'reveal-in-space': '',
};
