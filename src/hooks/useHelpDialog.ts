import { useState } from "react";
import type { GameStorage } from "../core/gameStorage";

export interface HelpDialog {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export function useHelpDialog(storage: GameStorage, hasStartedPlaying: boolean): HelpDialog {
  const [isOpen, setIsOpen] = useState(() => !hasStartedPlaying && !storage.hasSeenHelp());

  function close() {
    setIsOpen(false);
    storage.markHelpSeen();
  }

  return { isOpen, open: () => setIsOpen(true), close };
}
