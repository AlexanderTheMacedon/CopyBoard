import { createContext, useContext, type Dispatch, type ReactNode } from 'react';
import type { ReadOnlyLibrary } from '../domain/library';
import type { Item, Space } from '../domain/types';
import type { UiAction, UiState } from './state';

export interface PreviewContextValue {
  readonly state: UiState;
  readonly dispatch: Dispatch<UiAction>;
  readonly library: ReadOnlyLibrary;
  /** Polite status message, e.g. "Demo – not available". Never used to claim a successful save. */
  readonly notify: (message: string) => void;
}

const PreviewContext = createContext<PreviewContextValue | null>(null);

export function PreviewProvider({ value, children }: { value: PreviewContextValue; children: ReactNode }) {
  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
}

export function usePreview(): PreviewContextValue {
  const value = useContext(PreviewContext);
  if (!value) throw new Error('usePreview must be used inside <PreviewProvider>');
  return value;
}

/** The space of the current location, or `undefined` for global collections. */
export function useActiveSpace(): Space | undefined {
  const { state, library } = usePreview();
  return state.location.type === 'space' ? library.getSpace(state.location.spaceId) : undefined;
}

export function useInspectedItem(): Item | undefined {
  const { state, library } = usePreview();
  return state.inspectedItemId ? library.getItem(state.inspectedItemId) : undefined;
}
