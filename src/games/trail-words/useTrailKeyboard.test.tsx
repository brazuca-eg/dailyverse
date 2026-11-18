import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useTrailKeyboard } from "./useTrailKeyboard";

function Harness({ actions }: { actions: Parameters<typeof useTrailKeyboard>[0] }) {
  useTrailKeyboard(actions);
  return (
    <div>
      <button type="button">Button</button>
      <input aria-label="Field" />
      <dialog>
        <p>Dialog</p>
      </dialog>
    </div>
  );
}

function setup() {
  const actions = { onLetter: vi.fn(), onBackspace: vi.fn(), onSubmit: vi.fn() };
  const view = render(<Harness actions={actions} />);
  return { actions, view };
}

describe("useTrailKeyboard", () => {
  it("passes on letters, in either case", () => {
    const { actions } = setup();
    fireEvent.keyDown(document, { key: "a" });
    fireEvent.keyDown(document, { key: "B" });
    expect(actions.onLetter.mock.calls).toEqual([["a"], ["B"]]);
  });

  it("submits on Enter and deletes on Backspace", () => {
    const { actions } = setup();
    fireEvent.keyDown(document, { key: "Enter" });
    fireEvent.keyDown(document, { key: "Backspace" });
    expect(actions.onSubmit).toHaveBeenCalledTimes(1);
    expect(actions.onBackspace).toHaveBeenCalledTimes(1);
  });

  it("ignores other keys", () => {
    const { actions } = setup();
    ["1", " ", "Tab", "ArrowLeft", "Escape", "é"].forEach((key) =>
      fireEvent.keyDown(document, { key }),
    );
    expect(actions.onLetter).not.toHaveBeenCalled();
    expect(actions.onSubmit).not.toHaveBeenCalled();
    expect(actions.onBackspace).not.toHaveBeenCalled();
  });

  it("ignores shortcuts with Ctrl, Cmd or Alt", () => {
    const { actions } = setup();
    fireEvent.keyDown(document, { key: "c", ctrlKey: true });
    fireEvent.keyDown(document, { key: "r", metaKey: true });
    fireEvent.keyDown(document, { key: "x", altKey: true });
    expect(actions.onLetter).not.toHaveBeenCalled();
  });

  it("lets Enter activate a focused button instead of submitting, but still types letters", () => {
    const { actions, view } = setup();
    const button = view.getByRole("button", { name: "Button" });
    fireEvent.keyDown(button, { key: "Enter" });
    expect(actions.onSubmit).not.toHaveBeenCalled();
    fireEvent.keyDown(button, { key: "g" });
    expect(actions.onLetter).toHaveBeenCalledWith("g");
  });

  it("leaves text fields alone", () => {
    const { actions, view } = setup();
    fireEvent.keyDown(view.getByLabelText("Field"), { key: "a" });
    fireEvent.keyDown(view.getByLabelText("Field"), { key: "Backspace" });
    expect(actions.onLetter).not.toHaveBeenCalled();
    expect(actions.onBackspace).not.toHaveBeenCalled();
  });

  it("does nothing while a dialog is open", () => {
    const { actions, view } = setup();
    view.container.querySelector("dialog")?.setAttribute("open", "");
    fireEvent.keyDown(document, { key: "a" });
    fireEvent.keyDown(document, { key: "Enter" });
    expect(actions.onLetter).not.toHaveBeenCalled();
    expect(actions.onSubmit).not.toHaveBeenCalled();
  });

  it("uses the latest actions after a re-render, and stops after unmount", () => {
    const first = { onLetter: vi.fn(), onBackspace: vi.fn(), onSubmit: vi.fn() };
    const second = { onLetter: vi.fn(), onBackspace: vi.fn(), onSubmit: vi.fn() };
    const view = render(<Harness actions={first} />);
    view.rerender(<Harness actions={second} />);
    fireEvent.keyDown(document, { key: "a" });
    expect(first.onLetter).not.toHaveBeenCalled();
    expect(second.onLetter).toHaveBeenCalledTimes(1);
    view.unmount();
    fireEvent.keyDown(document, { key: "b" });
    expect(second.onLetter).toHaveBeenCalledTimes(1);
  });
});
