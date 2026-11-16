import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

HTMLDialogElement.prototype.show = function show() {
  this.setAttribute("open", "");
};

HTMLDialogElement.prototype.showModal = function showModal() {
  this.setAttribute("open", "");
};

HTMLDialogElement.prototype.close = function close() {
  if (this.hasAttribute("open")) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  }
};

afterEach(() => {
  cleanup();
  localStorage.clear();
});

if (typeof window.PointerEvent === "undefined") {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    pointerType: string;

    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
      this.pointerType = init.pointerType ?? "mouse";
    }
  }
  window.PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent;
}
