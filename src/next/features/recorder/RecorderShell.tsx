import { useId, useState, type CSSProperties } from 'react';
import { usePreview } from '../../app/context';
import { DemoBadge } from '../../components/DemoBadge';
import { Icon } from '../../components/Icon';
import { IconButton } from '../../components/IconButton';

/** Recorder lifecycle vocabulary from Blueprint 04 §5.3. */
export type RecorderStatus = 'idle' | 'requesting' | 'recording' | 'paused' | 'interrupted' | 'stopping' | 'saved' | 'error';

const statusCopy: Record<RecorderStatus, { label: string; text: string }> = {
  idle: { label: 'Bereit', text: 'Keine Aufnahme aktiv.' },
  requesting: { label: 'Berechtigung', text: 'Würde den Browser um Mikrofonzugriff bitten.' },
  recording: { label: 'Aufnahme', text: 'Würde aufnehmen; Zeitstempel für Screenshots und Dateien.' },
  paused: { label: 'Pausiert', text: 'Aufnahme angehalten, Session bleibt offen.' },
  interrupted: { label: 'Unterbrochen', text: 'Browser oder System hat die Aufnahme beendet. Rettung nur, wenn Rohdaten existieren.' },
  stopping: { label: 'Wird beendet', text: 'Originale würden gesichert, danach öffnet der Composer (D-009).' },
  saved: { label: 'Gesichert', text: 'Nur nach bestätigter lokaler Sicherung anzeigen.' },
  error: { label: 'Fehler', text: 'Klare Ursache und Rettungsweg anzeigen, keine Erfolgsanimation.' },
};

const statusOrder = Object.keys(statusCopy) as RecorderStatus[];
const step = (i: number) => ({ '--i': i }) as CSSProperties;

/**
 * Floating Recorder shell (D-008, DS-C25) in its own activity layer (L2). UI only: it never asks for microphone permission
 * and never records. The session panel stays mounted and morphs open/closed (M-07); it is inert while closed.
 * The status picker previews visual states for the design run and is labelled as such.
 */
export function RecorderShell() {
  const { dispatch } = usePreview();
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [panelOpen, setPanelOpen] = useState(false);
  const panelId = useId();
  const reasonId = useId();
  const copy = statusCopy[status];

  return (
    <section className="cb-recorder" aria-labelledby="cb-recorder-title" data-status={status} data-panel={panelOpen || undefined}>
      <div className="cb-recorder__bar">
        <span className="cb-recorder__indicator" aria-hidden="true" />
        <div className="cb-recorder__summary">
          <h2 id="cb-recorder-title" className="cb-recorder__title">
            Recorder <DemoBadge />
          </h2>
          <p className="cb-recorder__status" role="status">
            <span className="cb-recorder__status-label">{copy.label}</span> · Vorschau, es wird nichts aufgenommen
          </p>
        </div>
        <span className="cb-recorder__timer" aria-label="Keine laufende Aufnahme">
          --:--
        </span>
        <button type="button" className="cb-button cb-button--primary cb-button--sm" disabled aria-describedby={reasonId}>
          <Icon name="mic" size={16} />
          Starten
        </button>
        <IconButton
          icon="chevronDown"
          size="sm"
          className="cb-recorder__toggle"
          label={panelOpen ? 'Session-Panel einklappen' : 'Session-Panel ausklappen'}
          aria-expanded={panelOpen}
          aria-controls={panelId}
          onClick={() => setPanelOpen((v) => !v)}
        />
        <IconButton icon="x" size="sm" label="Recorder schließen" onClick={() => dispatch({ type: 'setRecorderOpen', open: false })} />
      </div>
      <p id={reasonId} className="cb-visually-hidden">
        Aufnahme ist in der Vorschau nicht verfügbar. Es wird keine Mikrofonberechtigung angefragt.
      </p>
      <div className="cb-recorder__drawer">
        <div id={panelId} inert={!panelOpen} aria-hidden={!panelOpen}>
          <div className="cb-recorder__panel">
            <p className="cb-recorder__text" style={step(0)}>
              {copy.text}
            </p>
            <fieldset className="cb-recorder__states" style={step(1)}>
              <legend>Zustandsvorschau (nur Darstellung)</legend>
              {statusOrder.map((value) => (
                <label key={value} className="cb-recorder__state">
                  <input type="radio" name="cb-recorder-status" value={value} checked={status === value} onChange={() => setStatus(value)} />
                  {statusCopy[value].label}
                </label>
              ))}
            </fieldset>
            <h3 className="cb-recorder__subtitle" style={step(2)}>
              <Icon name="clock" size={14} />
              Session-Timeline
            </h3>
            <div className="cb-recorder__timeline" aria-hidden="true" style={step(3)}>
              <p className="cb-recorder__moment">
                <time>00:00</time>
                <i>
                  <Icon name="image" size={14} />
                </i>
                <span />
              </p>
              <p className="cb-recorder__moment">
                <time>--:--</time>
                <i>
                  <Icon name="file" size={14} />
                </i>
                <span />
              </p>
            </div>
            <p className="cb-recorder__text" style={step(4)}>
              Noch keine Momente. Zeitgestempelte Screenshots und Dateien folgen mit der echten Aufnahme.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
