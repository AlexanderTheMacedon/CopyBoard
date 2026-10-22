import type { IconName } from '../components/Icon';

// One preference model for Quick Preferences and Settings Studio (D-033). Session-only in the preview: no persistence.

export type ThemeMode = 'light' | 'dark' | 'system';
export type SidebarMode = 'compact' | 'expanded' | 'dynamic';
export type Density = 'comfort' | 'standard' | 'compact';
export type ViewMode = 'grid' | 'list';

export interface Preferences {
  readonly theme: ThemeMode;
  readonly sidebarMode: SidebarMode;
  readonly density: Density;
  readonly view: ViewMode;
}

export const defaultPreferences: Preferences = {
  theme: 'system',
  // D-002: proposed default is the dynamic (hover) mode.
  sidebarMode: 'dynamic',
  density: 'standard',
  view: 'grid',
};

export interface PreferenceOption<V extends string> {
  readonly value: V;
  readonly label: string;
  readonly icon?: IconName;
}

export interface PreferenceDefinition<K extends keyof Preferences> {
  readonly key: K;
  readonly label: string;
  readonly options: readonly PreferenceOption<Preferences[K]>[];
}

export const themePreference: PreferenceDefinition<'theme'> = {
  key: 'theme',
  label: 'Erscheinungsbild',
  options: [
    { value: 'light', label: 'Hell', icon: 'sun' },
    { value: 'dark', label: 'Dunkel', icon: 'moon' },
    { value: 'system', label: 'System', icon: 'monitor' },
  ],
};

export const sidebarPreference: PreferenceDefinition<'sidebarMode'> = {
  key: 'sidebarMode',
  label: 'Seitenleiste',
  options: [
    { value: 'compact', label: 'Immer kompakt' },
    { value: 'expanded', label: 'Immer ausgefahren' },
    { value: 'dynamic', label: 'Dynamisch (Hover)' },
  ],
};

export const densityPreference: PreferenceDefinition<'density'> = {
  key: 'density',
  label: 'Dichte',
  options: [
    { value: 'comfort', label: 'Komfort' },
    { value: 'standard', label: 'Standard' },
    { value: 'compact', label: 'Kompakt' },
  ],
};

export const viewPreference: PreferenceDefinition<'view'> = {
  key: 'view',
  label: 'Ansicht',
  options: [
    { value: 'grid', label: 'Raster', icon: 'grid' },
    { value: 'list', label: 'Liste', icon: 'list' },
  ],
};
