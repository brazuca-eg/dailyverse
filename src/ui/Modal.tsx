import { useEffect, useId, useRef, type ReactNode } from "react";
import { CloseIcon } from "./icons";
import { uiMessages as t } from "./messages";
import "./Modal.css";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, title, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal-content">
        <header className="modal-header">
          <h2 id={titleId} className="modal-title">
            {title}
          </h2>
          <button
            type="button"
            className="icon-button"
            aria-label={t("ui.modal.close")}
            onClick={onClose}
          >
            <CloseIcon size={22} />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
