import { usePreview } from '../../app/context';
import { Icon, type IconName } from '../../components/Icon';
import { focusCapture } from '../capture/SmartCapture';

function DockButton({
  icon,
  label,
  onClick,
  pressed,
  primary,
}: {
  icon: IconName;
  label: string;
  onClick: () => void;
  pressed?: boolean;
  primary?: boolean;
}) {
  return (
    <button type="button" className={`cb-dock__button${primary ? ' cb-dock__button--primary' : ''}`} onClick={onClick} aria-pressed={pressed}>
      <Icon name={icon} size={22} />
      <span className="cb-dock__label">{label}</span>
    </button>
  );
}

/**
 * Adaptive Mobile Dock (D-030, DS-C38, SM-11). Base actions Spaces/Suche/Erfassen stay fixed; the recorder entry is the
 * contextual slot. Only rendered visibly on phones (CSS); every action opens the same domain as on desktop.
 */
export function MobileDock() {
  const { state, dispatch, notify } = usePreview();

  const capture = () => {
    if (state.composerItemId) {
      notify('Erfassen ist wieder verfügbar, sobald der Composer geschlossen ist.');
      return;
    }
    if (state.inspectedItemId) dispatch({ type: 'closeInspector' });
    requestAnimationFrame(focusCapture);
  };

  return (
    <nav className="cb-dock" aria-label="Schnellzugriff">
      <DockButton icon="spaces" label="Spaces" onClick={() => dispatch({ type: 'openOverlay', overlay: 'spaces-drawer' })} />
      <DockButton icon="search" label="Suche" onClick={() => dispatch({ type: 'openOverlay', overlay: 'search' })} />
      <DockButton icon="plus" label="Erfassen" primary onClick={capture} />
      <DockButton
        icon="mic"
        label="Aufnahme"
        pressed={state.recorderOpen}
        onClick={() => dispatch({ type: 'setRecorderOpen', open: !state.recorderOpen })}
      />
    </nav>
  );
}
