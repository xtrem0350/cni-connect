import { useEffect } from "react";

const protectionMessage = "Site protégé par Thierry Gogo";

export function SiteProtection() {
  useEffect(() => {
    const warn = () => window.alert(protectionMessage);
    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      warn();
    };
    const handleDragStart = (event: DragEvent) => {
      if (event.target instanceof HTMLImageElement) event.preventDefault();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      const blockedShortcut =
        event.key === "F12" ||
        (event.ctrlKey && event.shiftKey && ["I", "J", "C"].includes(event.key.toUpperCase())) ||
        (event.ctrlKey && event.key.toUpperCase() === "U");
      if (!blockedShortcut) return;
      event.preventDefault();
      warn();
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null;
}
