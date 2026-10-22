import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { PHONE_QUERY, useMediaQuery } from '../../app/hooks';
import { usePreview } from '../../app/context';
import { DemoBadge } from '../../components/DemoBadge';
import { Icon } from '../../components/Icon';
import { IconButton } from '../../components/IconButton';
import { SegmentedControl, type SegmentOption } from '../../components/SegmentedControl';
import { isTextual } from '../../domain/types';
import { MarkdownPreview } from './MarkdownPreview';

export type ComposerMode = 'source' | 'preview' | 'split';

const modeOptions = (phone: boolean): SegmentOption<ComposerMode>[] => [
  { value: 'source', label: 'Quelltext', icon: 'code' },
  { value: 'preview', label: 'Vorschau', icon: 'eye' },
  // D-007: Split View on desktop; on phones only one editor surface at a time.
  { value: 'split', label: 'Split', icon: 'columns', disabled: phone },
];

const step = (i: number) => ({ '--i': i }) as CSSProperties;

/** Context Rail (D-010): belongs to the Composer, not a second inspector. Content arrives with recorder/assets later. */
function ContextRail({ onClose }: { onClose: () => void }) {
  return (
    <aside className="cb-rail" aria-labelledby="cb-rail-title">
      <div className="cb-rail__header" style={step(0)}>
        <h3 id="cb-rail-title">Kontext</h3>
        <IconButton icon="x" size="sm" label="Kontextleiste schließen" onClick={onClose} />
      </div>
      <section className="cb-rail__section" aria-labelledby="cb-rail-assets" style={step(1)}>
        <h4 id="cb-rail-assets">
          <Icon name="image" size={14} />
          Materialien
        </h4>
        <div className="cb-rail__slots" aria-hidden="true">
          <span className="cb-rail__slot">
            <Icon name="image" size={16} />
          </span>
          <span className="cb-rail__slot">
            <Icon name="file" size={16} />
          </span>
          <span className="cb-rail__slot">
            <Icon name="waveform" size={16} />
          </span>
        </div>
        <p className="cb-rail__empty">Screenshots, Dateien und Audio erscheinen hier in einem späteren Run.</p>
      </section>
      <section className="cb-rail__section" aria-labelledby="cb-rail-timeline" style={step(2)}>
        <h4 id="cb-rail-timeline">
          <Icon name="clock" size={14} />
          Timeline
        </h4>
        <div className="cb-rail__timeline" aria-hidden="true">
          <p className="cb-rail__moment">
            <time>00:00</time>
            <span />
          </p>
          <p className="cb-rail__moment">
            <time>--:--</time>
            <span />
          </p>
          <p className="cb-rail__moment">
            <time>--:--</time>
            <span />
          </p>
        </div>
        <p className="cb-rail__empty">Zeitmarken einer Sprach-Session folgen mit dem Recorder.</p>
      </section>
    </aside>
  );
}

/**
 * Hybrid Composer (D-007, DS-C21, M-06): one document, three modes, own Context Rail. The draft lives only in this
 * component; the status says so explicitly instead of claiming a save (D-028).
 */
export function Composer() {
  const { state, dispatch, library } = usePreview();
  const item = state.composerItemId ? library.getItem(state.composerItemId) : undefined;
  const phone = useMediaQuery(PHONE_QUERY);
  const initial = item && isTextual(item) ? item.body : '';
  const [draft, setDraft] = useState(initial);
  const [mode, setMode] = useState<ComposerMode>('split');
  const [railOpen, setRailOpen] = useState(!phone);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => titleRef.current?.focus(), []);

  if (!item) return null;
  const effectiveMode: ComposerMode = phone && mode === 'split' ? 'source' : mode;
  const dirty = draft !== initial;
  const showSource = effectiveMode !== 'preview';
  const showPreview = effectiveMode !== 'source';

  return (
    <section className="cb-composer" aria-labelledby="cb-composer-title" data-mode={effectiveMode} data-rail={railOpen || undefined}>
      <header className="cb-composer__header">
        <IconButton icon="chevronLeft" label="Zurück zum Inspector" onClick={() => dispatch({ type: 'closeComposer' })} />
        <div className="cb-composer__heading">
          <p className="cb-composer__eyebrow">Composer</p>
          <h2 id="cb-composer-title" ref={titleRef} tabIndex={-1}>
            {item.title}
          </h2>
        </div>
        <p className="cb-composer__status" role="status" data-dirty={dirty || undefined}>
          <DemoBadge>Entwurf</DemoBadge>
          {dirty ? 'Geändert – wird nicht gespeichert' : 'Nicht gespeichert'}
        </p>
        <SegmentedControl label="Editor-Modus" size="sm" options={modeOptions(phone)} value={effectiveMode} onChange={setMode} />
        <IconButton
          icon="panelRight"
          label={railOpen ? 'Kontextleiste ausblenden' : 'Kontextleiste einblenden'}
          aria-pressed={railOpen}
          onClick={() => setRailOpen((v) => !v)}
        />
      </header>
      <div className="cb-composer__body">
        <div className="cb-composer__panes">
          {showSource && (
            <div className="cb-composer__pane">
              <span className="cb-composer__pane-label" aria-hidden="true">
                <Icon name="code" size={12} />
                Markdown
              </span>
              <label htmlFor="cb-composer-source" className="cb-visually-hidden">
                Markdown-Quelltext
              </label>
              <textarea
                id="cb-composer-source"
                className="cb-composer__source"
                spellCheck={false}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
            </div>
          )}
          {showPreview && (
            <div className="cb-composer__pane cb-composer__pane--preview" aria-label="Markdown-Vorschau" role="region">
              <span className="cb-composer__pane-label" aria-hidden="true">
                <Icon name="eye" size={12} />
                Vorschau
              </span>
              <MarkdownPreview source={draft} />
            </div>
          )}
        </div>
        {railOpen && <ContextRail onClose={() => setRailOpen(false)} />}
      </div>
    </section>
  );
}
