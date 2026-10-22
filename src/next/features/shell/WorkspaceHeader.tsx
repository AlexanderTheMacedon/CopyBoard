import { useEffect, useState, type CSSProperties, type RefObject } from 'react';
import { usePreview } from '../../app/context';
import { Icon, type IconName } from '../../components/Icon';
import { IconButton } from '../../components/IconButton';
import { Popover } from '../../components/Popover';
import { focusCapture } from '../capture/SmartCapture';
import { spaceColorVar } from '../items/item-meta';
import { ThemeQuickPreference } from './QuickPreferences';

export interface HeaderFact {
  readonly icon: IconName;
  readonly label: string;
}

interface WorkspaceHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  /** Small facts under the title (counts per type, favourites …); purely informational. */
  facts?: readonly HeaderFact[];
  /** Short count label for the collapsed toolbar, e.g. "6 Inhalte". */
  countLabel?: string;
  /** Scroll container of the workspace; the toolbar collapses when the hero scrolls away. */
  scrollRoot: RefObject<HTMLElement | null>;
}

// Collapse thresholds with hysteresis (D-020: no flicker on short direction changes). Candidates, calibrated in Run C.
const COLLAPSE_AT = 128;
const EXPAND_AT = 44;

const shortcutHint = () => (typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘K' : 'Strg K');

/** D-028 trust indicator, honest for the preview: nothing is saved or synced. */
function TrustIndicator() {
  return (
    <Popover label="Vorschau – Speicherstatus" icon="shield" iconSize={18} text="Vorschau" triggerClassName="cb-trust">
      {() => (
        <div className="cb-quick-pref">
          <p className="cb-quick-pref__title">Schreibgeschützte Vorschau</p>
          <p className="cb-quick-pref__note">
            Alle Inhalte sind synthetische Beispiele. Es wird nichts gespeichert, nichts synchronisiert und keine Verbindung zu
            einem Konto hergestellt.
          </p>
        </div>
      )}
    </Popover>
  );
}

/**
 * Ambient Canvas header (D-019) with Collapsing Ambient (D-020): the sticky toolbar is always mounted and only changes its
 * presentation via `data-collapsed`, so Search/Capture/Trust never remount (SM-10). Collapse is scroll-driven with a
 * hysteresis band instead of a single threshold.
 */
export function WorkspaceHeader({ eyebrow, title, description, facts, countLabel, scrollRoot }: WorkspaceHeaderProps) {
  const { state, dispatch, library } = usePreview();
  const [collapsed, setCollapsed] = useState(false);
  const space = state.location.type === 'space' ? library.getSpace(state.location.spaceId) : undefined;
  const locationKey = state.location.type === 'space' ? state.location.spaceId : state.location.collectionId;

  useEffect(() => {
    const root = scrollRoot.current;
    if (!root) return;
    let frame = 0;
    let current = false;
    const update = () => {
      frame = 0;
      const y = root.scrollTop;
      const next = current ? y > EXPAND_AT : y > COLLAPSE_AT;
      if (next !== current) {
        current = next;
        setCollapsed(next);
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => {
      root.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [scrollRoot]);

  // A new collection starts at the top of its board; the toolbar expands with it.
  useEffect(() => {
    scrollRoot.current?.scrollTo({ top: 0 });
  }, [scrollRoot, locationKey]);

  const tint = space ? spaceColorVar(space.color) : 'var(--cb-space-lavender)';

  return (
    <>
      {/* Ambient layer scrolls with the content and dissolves into the canvas (D-019); orbs are decorative only. */}
      <div className="cb-ambient" data-collapsed={collapsed || undefined} style={{ '--cb-ambient-tint': tint } as CSSProperties} aria-hidden="true">
        <span className="cb-ambient__orb cb-ambient__orb--a" />
        <span className="cb-ambient__orb cb-ambient__orb--b" />
        <span className="cb-ambient__orb cb-ambient__orb--c" />
        <span className="cb-ambient__orb cb-ambient__orb--d" />
        <span className="cb-ambient__orb cb-ambient__orb--e" />
        <span className="cb-ambient__orb cb-ambient__orb--tint" />
      </div>

      {/* Direct child of the scroll container so `position: sticky` holds for the whole board. */}
      <div className="cb-toolbar" data-collapsed={collapsed || undefined}>
        <IconButton
          icon="menu"
          label="Spaces öffnen"
          className="cb-toolbar__menu"
          onClick={() => dispatch({ type: 'openOverlay', overlay: 'spaces-drawer' })}
        />
        <div className="cb-toolbar__context" aria-hidden={!collapsed}>
          <span className="cb-toolbar__dot" style={{ background: tint }} />
          <p className="cb-toolbar__title">{title}</p>
          {countLabel && <span className="cb-toolbar__count">{countLabel}</span>}
        </div>
        <button
          type="button"
          className="cb-search-trigger"
          onClick={() => dispatch({ type: 'openOverlay', overlay: 'search' })}
          aria-keyshortcuts="Control+K Meta+K"
        >
          <Icon name="search" size={18} />
          <span className="cb-search-trigger__label">Suchen</span>
          <kbd className="cb-search-trigger__kbd">{shortcutHint()}</kbd>
        </button>
        <IconButton icon="plus" label="Erfassen" className="cb-toolbar__capture" onClick={focusCapture} />
        <ThemeQuickPreference />
        <TrustIndicator />
      </div>

      <header className="cb-hero" style={{ '--cb-hero-tint': tint } as CSSProperties}>
        <p className="cb-hero__eyebrow">
          {space && <span className="cb-hero__dot" style={{ background: tint }} aria-hidden="true" />}
          {eyebrow}
        </p>
        <h1 className="cb-hero__title" id="cb-workspace-title">
          {title}
        </h1>
        <p className="cb-hero__description">{description}</p>
        {facts && facts.length > 0 && (
          <ul className="cb-hero__facts" aria-label="Überblick">
            {facts.map((fact) => (
              <li key={fact.label} className="cb-hero__fact">
                <Icon name={fact.icon} size={14} />
                {fact.label}
              </li>
            ))}
          </ul>
        )}
      </header>
    </>
  );
}
