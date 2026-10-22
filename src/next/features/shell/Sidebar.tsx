import { usePreview } from '../../app/context';
import { BrandMark } from '../../components/BrandMark';
import { Icon } from '../../components/Icon';
import { SpaceNav } from '../spaces/SpaceNav';
import { SidebarModeQuickPreference } from './QuickPreferences';

/**
 * Desktop/tablet sidebar (D-002, DS-C02). Modes via `data-sidebar` on the app root:
 * compact = icon rail, expanded = pinned panel taking layout space, dynamic = rail that expands as overlay on hover or
 * keyboard focus without moving the workspace (M-01). Hidden on phones, where the drawer and dock take over (D-030).
 */
export function Sidebar() {
  const { dispatch } = usePreview();
  return (
    <aside className="cb-sidebar" aria-label="Seitenleiste">
      <div className="cb-sidebar__panel">
        <div className="cb-sidebar__brand">
          <BrandMark />
          <span className="cb-nav__label cb-sidebar__brand-name">
            CopyBoard <span className="cb-sidebar__badge">Preview</span>
          </span>
        </div>
        <div className="cb-sidebar__scroll">
          <SpaceNav idPrefix="cb-sidebar" />
        </div>
        <div className="cb-sidebar__footer">
          <button type="button" className="cb-nav__item" title="Einstellungen" onClick={() => dispatch({ type: 'openSettings' })}>
            <span className="cb-nav__icon" aria-hidden="true">
              <Icon name="sliders" />
            </span>
            <span className="cb-nav__label">Einstellungen</span>
          </button>
          <SidebarModeQuickPreference />
        </div>
      </div>
    </aside>
  );
}
