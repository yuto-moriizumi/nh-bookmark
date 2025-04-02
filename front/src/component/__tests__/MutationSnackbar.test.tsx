import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom";
import { render, screen, act } from "@testing-library/react";
import { MutationSnackbar } from "../MutationSnackbar";

// Mock mutation states
const createMockMutation = (
  status: "idle" | "pending" | "success" | "error",
) => {
  return {
    status,
    isIdle: status === "idle",
    isPending: status === "pending",
    isSuccess: status === "success",
    isError: status === "error",
    reset: vi.fn(),
  };
};

describe("MutationSnackbar Component", () => {
  // Use fake timers to control setTimeout for autoHideDuration
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const messages = {
    success: "Success message",
    pending: "Pending message",
    error: "Error message",
  };

  it("renders nothing when mutation is idle", () => {
    const mockMutation = createMockMutation("idle");
    const { container } = render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <MutationSnackbar mutation={mockMutation as any} message={messages} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders pending message when mutation is pending", () => {
    const mockMutation = createMockMutation("pending");
    render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <MutationSnackbar mutation={mockMutation as any} message={messages} />,
    );

    expect(screen.getByText("Pending message")).toBeInTheDocument();
  });

  it("renders success message when mutation is successful", () => {
    const mockMutation = createMockMutation("success");
    render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <MutationSnackbar mutation={mockMutation as any} message={messages} />,
    );

    expect(screen.getByText("Success message")).toBeInTheDocument();
  });

  it("renders error message when mutation has error", () => {
    const mockMutation = createMockMutation("error");
    render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <MutationSnackbar mutation={mockMutation as any} message={messages} />,
    );

    expect(screen.getByText("Error message")).toBeInTheDocument();
  });

  it("calls reset when closed after success", () => {
    const mockMutation = createMockMutation("success");

    render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <MutationSnackbar mutation={mockMutation as any} message={messages} />,
    );

    // Advance timer to trigger autoHideDuration within act
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    // Check if reset was called via onClose
    expect(mockMutation.reset).toHaveBeenCalledTimes(1);
  });

  it("calls reset when closed after error", () => {
    const mockMutation = createMockMutation("error");

    render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <MutationSnackbar mutation={mockMutation as any} message={messages} />,
    );

    // Advance timer to trigger autoHideDuration within act
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    // Check if reset was called via onClose
    expect(mockMutation.reset).toHaveBeenCalledTimes(1);
  });

  it("does not call reset when closed during pending state", () => {
    const mockMutation = createMockMutation("pending");

    render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <MutationSnackbar mutation={mockMutation as any} message={messages} />,
    );

    // Advance timer to trigger autoHideDuration within act
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    // Check that reset was not called (onClose shouldn't call reset in pending state)
    expect(mockMutation.reset).not.toHaveBeenCalled();
  });
});
