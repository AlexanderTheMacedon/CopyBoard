import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { usePreview } from '../../app/context';
import { Icon } from '../../components/Icon';
import { IconButton } from '../../components/IconButton';
import { Popover } from '../../components/Popover';
import { focusCapture } from '../capture/SmartCapture';
import { spaceColorVar } from '../items/item-meta';
import { ThemeQuickPreference } from './QuickPreferences';

interface WorkspaceHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  /** Scroll container of the workspace; the toolbar collapses when the hero title leaves it. */
  scrollRoot: RefObject<HTMLElement | null>;
}

const shortcutHint = () => (typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘K' : 'Strg K');

/** D-028 trust indicator, honest for the preview: nothing is saved or synced. */
function TrustIndicator() {
  return (
    <Popover label="Vorschau – Speicherstatus" icon="shield" text="Vorschau" triggerClassName="cb-trust">
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
 * presentation via `data-collapsed`, so Search/Capture/Trust never remount (SM-10).
 */
export function WorkspaceHeader({ eyebrow, title, description, scrollRoot }: WorkspaceHeaderProps) {
  const { state, dispatch, library } = usePreview();
  const heroRef = useRef<HTMLHeadingElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const space = state.location.type === 'space' ? library.getSpace(state.location.spaceId) : undefined;

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setCollapsed(!entry?.isIntersecting), {
      root: scrollRoot.current,
      threshold: 0,
      // Collapse slightly before the title fully leaves, which also gives a small hysteresis band.
      rootMargin: '-56px 0px 0px 0px',
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, [scrollRoot]);

  const tint = space ? spaceColorVar(space.color) : 'var(--cb-space-lavender)';

  return (
    <>
      {/* Ambient layer scrolls with the content and fades into the canvas (D-019); orbs are decorative only. */}
      <div className="cb-ambient" data-collapsed={collapsed || undefined} style={{ '--cb-ambient-tint': tint } as CSSProperties} aria-hidden="true">
        <span className="cb-ambient__orb cb-ambient__orb--a" />
        <span className="cb-ambient__orb cb-ambient__orb--b" />
        <span className="cb-ambient__orb cb-ambient__orb--c" />
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
        <p className="cb-toolbar__title" aria-hidden={!collapsed}>
          {title}
        </p>
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

      <header className="cb-hero">
        <p className="cb-hero__eyebrow">
          {space && <span className="cb-hero__dot" style={{ background: tint }} aria-hidden="true" />}
          {eyebrow}
        </p>
        <h1 ref={heroRef} className="cb-hero__title" id="cb-workspace-title">
          {title}
        </h1>
        <p className="cb-hero__description">{description}</p>
      </header>
    </>
  );
}
