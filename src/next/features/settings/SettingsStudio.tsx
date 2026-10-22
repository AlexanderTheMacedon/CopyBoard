import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { usePreview } from '../../app/context';
import { densityPreference, sidebarPreference, themePreference, viewPreference, type PreferenceDefinition, type Preferences } from '../../app/preferences';
import type { SettingsSection } from '../../app/state';
import { DemoBadge } from '../../components/DemoBadge';
import { Dialog } from '../../components/Dialog';
import { IconButton } from '../../components/IconButton';
import { SegmentedControl } from '../../components/SegmentedControl';

const sections: readonly { id: SettingsSection; label: string }[] = [
  { id: 'general', label: 'Allgemein & Darstellung' },
  { id: 'data', label: 'Daten & Synchronisierung' },
  { id: 'security', label: 'Sicherheit & Datenschutz' },
];

function PreferenceRow<K extends keyof Preferences>({ definition }: { definition: PreferenceDefinition<K> }) {
  const { state, dispatch } = usePreview();
  return (
    <div className="cb-settings__row">
      <p className="cb-settings__label">{definition.label}</p>
      <SegmentedControl
        label={definition.label}
        size="sm"
        options={definition.options}
        value={state.prefs[definition.key]}
        onChange={(value) => dispatch({ type: 'setPreference', patch: { [definition.key]: value } as Partial<Preferences> })}
      />
    </div>
  );
}

/** Placeholder row for a setting whose real implementation needs a later, separately approved run. */
function PendingRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="cb-settings__row cb-settings__row--pending">
      <p className="cb-settings__label">
        {label} <DemoBadge>Noch nicht verfügbar</DemoBadge>
      </p>
      <p className="cb-settings__hint">{children}</p>
    </div>
  );
}

function SectionContent({ section }: { section: SettingsSection }) {
  switch (section) {
    case 'general':
      return (
        <>
          <PreferenceRow definition={themePreference} />
          <PreferenceRow definition={sidebarPreference} />
          <PreferenceRow definition={densityPreference} />
          <PreferenceRow definition={viewPreference} />
          <PendingRow label="Sprache">Deutsch. Weitere Sprachen folgen.</PendingRow>
          <p className="cb-settings__note">Änderungen gelten nur für diese Sitzung und werden nicht gespeichert.</p>
        </>
      );
    case 'data':
      return (
        <>
          <PendingRow label="Speicherort">Die Vorschau zeigt synthetische Beispieldaten und speichert nichts.</PendingRow>
          <PendingRow label="Konto & Cloud">Keine Anmeldung und keine Synchronisierung in der Vorschau.</PendingRow>
          <PendingRow label="Export & Backup">Folgt mit dem Datenadapter eines späteren Runs.</PendingRow>
        </>
      );
    case 'security':
      return (
        <>
          <PendingRow label="Mikrofon">Es wird keine Berechtigung angefragt; der Recorder ist eine reine Oberfläche.</PendingRow>
          <PendingRow label="PIN-Schutz">Gesperrte Inhalte und PIN-Entsperrung folgen später.</PendingRow>
          <PendingRow label="Datenschutz">Keine Netzwerkverbindungen, keine Zwischenablage, keine Dateien.</PendingRow>
        </>
      );
  }
}

/** Settings Studio (D-033, DS-C37): same preference state as the Quick Preferences; data/security areas are prepared only. */
export function SettingsStudio() {
  const { state, dispatch } = usePreview();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const close = () => dispatch({ type: 'closeOverlay' });
  const current = sections.findIndex((s) => s.id === state.settingsSection);

  const onTabKeyDown = (event: KeyboardEvent) => {
    const delta = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    if (!delta) return;
    event.preventDefault();
    const next = (current + delta + sections.length) % sections.length;
    const section = sections[next];
    if (!section) return;
    dispatch({ type: 'setSettingsSection', section: section.id });
    tabRefs.current[next]?.focus();
  };

  return (
    <Dialog open={state.overlay === 'settings'} onClose={close} labelledBy="cb-settings-title" variant="sheet">
      <div className="cb-settings">
        <header className="cb-settings__header">
          <h2 id="cb-settings-title">Einstellungen</h2>
          <IconButton icon="x" label="Einstellungen schließen" onClick={close} />
        </header>
        <div className="cb-settings__layout">
          <div role="tablist" aria-label="Bereiche" aria-orientation="vertical" className="cb-settings__tabs" onKeyDown={onTabKeyDown}>
            {sections.map((section, index) => (
              <button
                key={section.id}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                type="button"
                role="tab"
                id={`cb-settings-tab-${section.id}`}
                aria-selected={section.id === state.settingsSection}
                aria-controls="cb-settings-panel"
                tabIndex={section.id === state.settingsSection ? 0 : -1}
                className="cb-settings__tab"
                onClick={() => dispatch({ type: 'setSettingsSection', section: section.id })}
              >
                {section.label}
              </button>
            ))}
          </div>
          <div role="tabpanel" id="cb-settings-panel" aria-labelledby={`cb-settings-tab-${state.settingsSection}`} className="cb-settings__panel">
            <SectionContent section={state.settingsSection} />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
