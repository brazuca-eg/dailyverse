import { useState } from "react";
import { hasSeenHelp, markHelpSeen } from "./persistence";

export interface HelpDialog {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export function useHelpDialog(hasStartedPlaying: boolean): HelpDialog {
  const [isOpen, setIsOpen] = useState(() => !hasStartedPlaying && !hasSeenHelp());

  function close() {
    setIsOpen(false);
    markHelpSeen();
  }

  return { isOpen, open: () => setIsOpen(true), close };
}
