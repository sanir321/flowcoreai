import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionError } from "@/components/shared/section-error";

describe("SectionError", () => {
  it("renders error message and try again button", () => {
    const reset = vi.fn();
    const error = new Error("Test error message");

    render(<SectionError error={error} reset={reset} label="test" />);

    expect(screen.getByText("This test ran into a problem")).toBeInTheDocument();
    expect(screen.getByText("Test error message")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("shows fallback message when no error message provided", () => {
    const reset = vi.fn();
    const error = new Error();

    render(<SectionError error={error} reset={reset} label="test" />);

    expect(screen.getByText("An unexpected error occurred")).toBeInTheDocument();
  });

  it("calls reset on button click", () => {
    const reset = vi.fn();
    const error = new Error("test");

    render(<SectionError error={error} reset={reset} label="test" />);

    screen.getByRole("button", { name: "Try again" }).click();
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
