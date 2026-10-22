import { usePreview } from '../../app/context';
import { BrandMark } from '../../components/BrandMark';
import { Dialog } from '../../components/Dialog';
import { Icon } from '../../components/Icon';
import { IconButton } from '../../components/IconButton';
import { SpaceNav } from '../spaces/SpaceNav';

/** Mobile/tablet navigation drawer (D-002 mobile, D-030): tap-opened, no hover simulation, same SpaceNav as the sidebar. */
export function SpacesDrawer() {
  const { state, dispatch } = usePreview();
  const close = () => dispatch({ type: 'closeOverlay' });
  return (
    <Dialog open={state.overlay === 'spaces-drawer'} onClose={close} labelledBy="cb-drawer-title" variant="drawer">
      <div className="cb-drawer">
        <header className="cb-drawer__header">
          <span className="cb-drawer__brand">
            <BrandMark size={32} />
            <h2 id="cb-drawer-title">Spaces</h2>
          </span>
          <IconButton icon="x" label="Spaces schließen" onClick={close} />
        </header>
        <SpaceNav idPrefix="cb-drawer" />
        <button
          type="button"
          className="cb-nav__item"
          onClick={() => {
            dispatch({ type: 'openSettings' });
          }}
        >
          <span className="cb-nav__icon" aria-hidden="true">
            <Icon name="sliders" />
          </span>
          <span className="cb-nav__label">Einstellungen</span>
        </button>
      </div>
    </Dialog>
  );
}
