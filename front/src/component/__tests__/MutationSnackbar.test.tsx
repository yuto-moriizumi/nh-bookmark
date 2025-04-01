import { vi, describe, it, expect } from 'vitest';
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe.skip("MutationSnackbar Component", () => {
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

  it("calls reset when closed after success", async () => {
    const user = userEvent.setup();
    const mockMutation = createMockMutation("success");

    render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <MutationSnackbar mutation={mockMutation as any} message={messages} />,
    );

    // Find the close button
    const closeButton = screen.getByRole("button", { name: /close/i });

    // Click the close button
    await user.click(closeButton);

    // Check if reset was called
    expect(mockMutation.reset).toHaveBeenCalledTimes(1);
  });

  it("calls reset when closed after error", async () => {
    const user = userEvent.setup();
    const mockMutation = createMockMutation("error");

    render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <MutationSnackbar mutation={mockMutation as any} message={messages} />,
    );

    // Find the close button
    const closeButton = screen.getByRole("button", { name: /close/i });

    // Click the close button
    await user.click(closeButton);

    // Check if reset was called
    expect(mockMutation.reset).toHaveBeenCalledTimes(1);
  });

  it("does not call reset when closed during pending state", async () => {
    const user = userEvent.setup();
    const mockMutation = createMockMutation("pending");

    render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <MutationSnackbar mutation={mockMutation as any} message={messages} />,
    );

    // Find the close button
    const closeButton = screen.getByRole("button", { name: /close/i });

    // Click the close button
    await user.click(closeButton);

    // Check that reset was not called
    expect(mockMutation.reset).not.toHaveBeenCalled();
  });
});
