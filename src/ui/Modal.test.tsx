import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";

function renderModal(open: boolean, onClose = vi.fn()) {
  const view = render(
    <Modal open={open} title="How to play" onClose={onClose}>
      <p>Dialog content</p>
    </Modal>,
  );
  return { ...view, onClose };
}

function findDialog(): HTMLDialogElement {
  return screen.getByRole("dialog", { hidden: true }) as HTMLDialogElement;
}

describe("Modal", () => {
  it("is closed while open is false", () => {
    renderModal(false);
    expect(findDialog().open).toBe(false);
  });

  it("opens as a modal dialog named after its title", () => {
    renderModal(true);
    const dialog = screen.getByRole("dialog", { name: "How to play" });
    expect(dialog).toHaveAttribute("open");
    expect(screen.getByText("Dialog content")).toBeInTheDocument();
  });

  it("opens and closes when the open prop changes", () => {
    const { rerender, onClose } = renderModal(false);
    expect(findDialog().open).toBe(false);

    rerender(
      <Modal open title="How to play" onClose={onClose}>
        <p>Dialog content</p>
      </Modal>,
    );
    expect(findDialog().open).toBe(true);

    rerender(
      <Modal open={false} title="How to play" onClose={onClose}>
        <p>Dialog content</p>
      </Modal>,
    );
    expect(findDialog().open).toBe(false);
  });

  it("asks to close from the Close button", async () => {
    const { onClose } = renderModal(true);
    await userEvent.setup().click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("asks to close when the browser closes the dialog, for example on Escape", () => {
    const { onClose } = renderModal(true);
    fireEvent(findDialog(), new Event("close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("asks to close when the backdrop is clicked", async () => {
    const { onClose } = renderModal(true);
    await userEvent.setup().click(findDialog());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stays open when the content inside is clicked", async () => {
    const { onClose } = renderModal(true);
    await userEvent.setup().click(screen.getByText("Dialog content"));
    expect(onClose).not.toHaveBeenCalled();
  });
});
