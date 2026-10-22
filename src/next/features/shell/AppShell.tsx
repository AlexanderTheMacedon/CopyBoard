import { useEffect, useRef, type DragEvent, type ReactNode } from 'react';
import { isEditableTarget, useMediaQuery } from '../../app/hooks';
import { usePreview } from '../../app/context';
import { Composer } from '../composer/Composer';
import { Inspector } from '../inspector/Inspector';
import { RecorderShell } from '../recorder/RecorderShell';
import { SearchPalette } from '../search/SearchPalette';
import { SettingsStudio } from '../settings/SettingsStudio';
import { Board } from './Board';
import { MobileDock } from './MobileDock';
import { Sidebar } from './Sidebar';
import { SpacesDrawer } from './SpacesDrawer';

/**
 * Hybrid Workspace shell (D-001): sidebar, header + workspace, contextual right area (Inspector or Composer), activity layer
 * (Recorder), modal layers (Search, Settings, Drawer) and the mobile dock. Layout state is exposed as data attributes so the
 * design run can style every state without touching component logic.
 */
export function AppShell({ children }: { children?: ReactNode }) {
  const { state, dispatch, notify } = usePreview();
  const workspaceRef = useRef<HTMLElement>(null);
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = state.prefs.theme === 'system' ? (prefersDark ? 'dark' : 'light') : state.prefs.theme;
  const detail = state.composerItemId ? 'composer' : state.inspectedItemId ? 'inspector' : 'none';

  useEffect(() => {
    // Global search shortcut (H-02: Cmd/Ctrl+K is only *proposed*). Editable fields keep their native shortcuts.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
      if (isEditableTarget(event.target) || state.overlay) return;
      event.preventDefault();
      dispatch({ type: 'openOverlay', overlay: 'search' });
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [dispatch, state.overlay]);

  // Drops outside Smart Capture must not navigate the tab to the file; nothing is read from the drag data.
  const swallowDrag = (event: DragEvent) => event.preventDefault();
  const swallowDrop = (event: DragEvent) => {
    event.preventDefault();
    notify('Demo: Abgelegte Dateien werden in der Vorschau nicht übernommen.');
  };

  return (
    <div
      className="cb-app"
      data-theme={theme}
      data-sidebar={state.prefs.sidebarMode}
      data-detail={detail}
      data-recorder={state.recorderOpen || undefined}
      onDragOver={swallowDrag}
      onDrop={swallowDrop}
    >
      <a className="cb-skip-link" href="#cb-main">
        Zum Inhalt springen
      </a>
      <Sidebar />
      <div className="cb-stage">
        <main id="cb-main" ref={workspaceRef} className="cb-workspace" tabIndex={-1} aria-labelledby="cb-workspace-title">
          {state.composerItemId ? <Composer key={state.composerItemId} /> : <Board scrollRoot={workspaceRef} />}
        </main>
        {detail === 'inspector' && <Inspector />}
      </div>
      {state.recorderOpen && <RecorderShell />}
      <MobileDock />
      <SearchPalette />
      <SettingsStudio />
      <SpacesDrawer />
      {children}
    </div>
  );
}
