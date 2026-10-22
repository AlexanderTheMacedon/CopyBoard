import { Icon } from '../../components/Icon';
import { IconButton } from '../../components/IconButton';

/**
 * Polite live region for preview notices (DS-C32 skeleton). It only ever says that something is unavailable; it never
 * confirms a save, copy or sync (Truthful Status Contract, Blueprint 04 §5.2).
 */
export function NoticeRegion({ notice, onDismiss }: { notice: { id: number; message: string } | null; onDismiss: () => void }) {
  return (
    <div className="cb-notice-region" role="status" aria-live="polite">
      {notice && (
        // Keyed by id so a repeated message is announced again.
        <div key={notice.id} className="cb-notice">
          <Icon name="info" size={18} />
          <p>{notice.message}</p>
          <IconButton icon="x" size="sm" label="Hinweis schließen" onClick={onDismiss} />
        </div>
      )}
    </div>
  );
}
