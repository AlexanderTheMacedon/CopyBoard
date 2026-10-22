import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import type { ReadOnlyLibrary } from '../domain/library';
import type { Location } from '../domain/types';
import { AppShell } from '../features/shell/AppShell';
import { NoticeRegion } from '../features/shell/NoticeRegion';
import { PreviewProvider, type PreviewContextValue } from './context';
import { createInitialState, uiReducer } from './state';

const NOTICE_MS = 6000;

export function App({ library, initialLocation }: { library: ReadOnlyLibrary; initialLocation?: Location }) {
  const [state, dispatch] = useReducer(
    uiReducer,
    initialLocation ?? { type: 'space', spaceId: library.spaces[0]?.id ?? '' },
    createInitialState,
  );
  const [notice, setNotice] = useState<{ id: number; message: string } | null>(null);

  const notify = useCallback((message: string) => setNotice((prev) => ({ id: (prev?.id ?? 0) + 1, message })), []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  const value = useMemo<PreviewContextValue>(() => ({ state, dispatch, library, notify }), [state, library, notify]);

  return (
    <PreviewProvider value={value}>
      <AppShell>
        <NoticeRegion notice={notice} onDismiss={() => setNotice(null)} />
      </AppShell>
    </PreviewProvider>
  );
}
