// Domain model of the preview. Pure data, no behaviour: the same shapes are later produced by a typed legacy reader/adapter.

export type SpaceId = string;
export type ItemId = string;

/** Individual space identity colour (D-018/D-031). Independent of the Lavender brand palette and of status colours. */
export type SpaceColor = 'lavender' | 'sky' | 'sage' | 'peach' | 'rose';

export interface Space {
  readonly id: SpaceId;
  readonly name: string;
  readonly color: SpaceColor;
  readonly description: string;
}

export type ItemKind = 'text' | 'markdown' | 'code' | 'image' | 'file' | 'audio';

interface ItemBase {
  readonly id: ItemId;
  readonly spaceId: SpaceId;
  readonly title: string;
  /** ISO 8601 timestamps. */
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly tags: readonly string[];
  readonly favorite: boolean;
}

export interface TextItem extends ItemBase {
  readonly kind: 'text' | 'markdown';
  readonly body: string;
}

export interface CodeItem extends ItemBase {
  readonly kind: 'code';
  readonly language: string;
  readonly body: string;
}

/** Synthetic image: rendered as a gradient, no binary asset and no network request. */
export interface ImageItem extends ItemBase {
  readonly kind: 'image';
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  readonly palette: readonly [string, string, string];
}

export interface FileItem extends ItemBase {
  readonly kind: 'file';
  readonly fileName: string;
  readonly sizeBytes: number;
}

export interface AudioItem extends ItemBase {
  readonly kind: 'audio';
  readonly durationSec: number;
  /** Normalised bar heights 0..1 for a static waveform preview. */
  readonly waveform: readonly number[];
}

export type Item = TextItem | CodeItem | ImageItem | FileItem | AudioItem;

/** Global quick-access views (D-018), subordinate to the spaces. */
export type CollectionId = 'all' | 'favorites' | 'recent' | 'sessions';

export interface Collection {
  readonly id: CollectionId;
  readonly name: string;
  /** `false` = the view exists in the IA but has no data source in the preview yet. */
  readonly available: boolean;
}

export type Location =
  | { readonly type: 'space'; readonly spaceId: SpaceId }
  | { readonly type: 'collection'; readonly collectionId: CollectionId };

export const isTextual = (item: Item): item is TextItem | CodeItem =>
  item.kind === 'text' || item.kind === 'markdown' || item.kind === 'code';
