import { Icon, type IconName } from '../../components/Icon';

type EmptyVariant = 'space-empty' | 'collection-empty' | 'unavailable';

const copy: Record<EmptyVariant, { icon: IconName; title: string; text: string }> = {
  // D-026 Living Empty State: only for a confirmed empty space. Capture above stays the single primary entry.
  'space-empty': {
    icon: 'inbox',
    title: 'Dieser Space ist noch leer',
    text: 'Dein erster Inhalt erscheint hier, sobald er sicher gespeichert ist. In der Vorschau wird noch nichts gespeichert.',
  },
  'collection-empty': {
    icon: 'layers',
    title: 'Noch keine Inhalte',
    text: 'In dieser Ansicht gibt es aktuell keine Einträge.',
  },
  unavailable: {
    icon: 'info',
    title: 'Noch nicht verfügbar',
    text: 'Diese Ansicht folgt in einem späteren Run. Die Vorschau enthält dafür noch keine Daten.',
  },
};

export function EmptyState({ variant }: { variant: EmptyVariant }) {
  const { icon, title, text } = copy[variant];
  return (
    <div className="cb-empty" data-variant={variant}>
      {/* Illustration slot for the design run; motif is not decided yet (D-026). */}
      <div className="cb-empty__art" aria-hidden="true">
        <Icon name={icon} size={28} />
      </div>
      <h2 className="cb-empty__title">{title}</h2>
      <p className="cb-empty__text">{text}</p>
    </div>
  );
}
