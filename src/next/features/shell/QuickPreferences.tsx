import { usePreview } from '../../app/context';
import { sidebarPreference, themePreference } from '../../app/preferences';
import { Popover } from '../../components/Popover';
import { SegmentedControl } from '../../components/SegmentedControl';

// Contextual Quick Preferences (D-033). They write the same preference state as the Settings Studio.

export function ThemeQuickPreference() {
  const { state, dispatch } = usePreview();
  return (
    <Popover label="Erscheinungsbild" icon={state.prefs.theme === 'dark' ? 'moon' : state.prefs.theme === 'light' ? 'sun' : 'monitor'}>
      {() => (
        <div className="cb-quick-pref">
          <p className="cb-quick-pref__title">Erscheinungsbild</p>
          <SegmentedControl
            label={themePreference.label}
            options={themePreference.options}
            value={state.prefs.theme}
            onChange={(theme) => dispatch({ type: 'setPreference', patch: { theme } })}
          />
          <p className="cb-quick-pref__note">Gilt nur für diese Sitzung.</p>
        </div>
      )}
    </Popover>
  );
}

/** Sidebar bottom popover with the three modes from D-002. */
export function SidebarModeQuickPreference() {
  const { state, dispatch } = usePreview();
  return (
    <Popover label="Seitenleiste" icon="sidebar" text="Seitenleiste" textClassName="cb-nav__label" placement="right-end" triggerClassName="cb-nav__item cb-nav__item--icon-direct">
      {(close) => (
        <div className="cb-quick-pref">
          <p className="cb-quick-pref__title">Seitenleiste</p>
          <div role="radiogroup" aria-label={sidebarPreference.label} className="cb-option-list">
            {sidebarPreference.options.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={state.prefs.sidebarMode === option.value}
                className="cb-option-list__item"
                onClick={() => {
                  dispatch({ type: 'setPreference', patch: { sidebarMode: option.value } });
                  close();
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="cb-link-button"
            onClick={() => {
              close();
              dispatch({ type: 'openSettings', section: 'general' });
            }}
          >
            Alle Einstellungen
          </button>
        </div>
      )}
    </Popover>
  );
}
