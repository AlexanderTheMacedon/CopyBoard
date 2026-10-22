import { useEffect, useRef, type ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  /** Layout variant; styling lives in components.css. */
  variant: 'palette' | 'sheet' | 'drawer';
  className?: string;
  children: ReactNode;
}

/**
 * Modal layer (IA-02 L4/L5) on the native <dialog>: top layer, focus containment, inert background and Escape come from the
 * platform. Focus returns to the previously focused element when the dialog closes. Content is only mounted while open.
 */
export function Dialog({ open, onClose, labelledBy, variant, className, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`cb-dialog cb-dialog--${variant}${className ? ` ${className}` : ''}`}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        // Escape: let React state drive closing so the open prop never disagrees with the DOM.
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // A click on the backdrop targets the <dialog> element itself; clicks inside hit the panel.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {open && <div className="cb-dialog__panel">{children}</div>}
    </dialog>
  );
}
