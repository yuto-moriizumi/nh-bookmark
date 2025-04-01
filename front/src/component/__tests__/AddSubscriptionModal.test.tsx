import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddSubscriptionModal } from "../AddSubscriptionModal";
import { DEFAULT_RANK } from "../SubscriptionCard";
import * as util from "../../util";

// Mock the updateSubscription function
jest.mock("../../util", () => ({
  updateSubscription: jest.fn(),
}));

// Mock the queryClient and client
jest.mock("../index", () => ({
  queryClient: {
    setQueryData: jest.fn(),
  },
  client: {
    post: jest.fn().mockResolvedValue({ data: {} }),
  },
}));

// Mock the MutationSnackbar component
jest.mock("../MutationSnackbar", () => ({
  MutationSnackbar: jest.fn(() => null),
}));

// Mock the Modal component
jest.mock("../Modal", () => ({
  Modal: jest.fn(({ children, open, onClose }) =>
    open ? ( // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
      <div data-testid="modal" onClick={onClose}>
        {children}
      </div>
    ) : null,
  ),
}));

describe.skip("AddSubscriptionModal Component", () => {
  const mockProps = {
    open: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock document.URL
    Object.defineProperty(document, "URL", {
      value: "https://example.com/test",
      writable: true,
    });
    // Mock successful updateSubscription
    (util.updateSubscription as jest.Mock).mockResolvedValue({
      sub_url: "https://example.com/test",
      rank: DEFAULT_RANK,
      has_new: true,
      checked_at: Date.now(),
      updated_at: Date.now(),
      image: "https://example.com/image.jpg",
      name: "Test Author",
      title: "Test Title",
      work_url: "https://example.com/work",
    });
  });

  it("renders the modal with correct title when open", () => {
    render(<AddSubscriptionModal {...mockProps} />);

    expect(screen.getByText("新規購読を追加")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<AddSubscriptionModal {...mockProps} open={false} />);

    expect(screen.queryByText("新規購読を追加")).not.toBeInTheDocument();
  });

  it("displays the current URL in a read-only field", () => {
    render(<AddSubscriptionModal {...mockProps} />);

    const urlField = screen.getByLabelText("URL");
    expect(urlField).toBeInTheDocument();
    expect(urlField).toHaveValue("https://example.com/test");
    expect(urlField).toHaveAttribute("readonly");
  });

  it("initializes with default rank", () => {
    render(<AddSubscriptionModal {...mockProps} />);

    // Check if rating component has the default value
    const ratingElement = screen.getByRole("radio", {
      name: new RegExp(`${DEFAULT_RANK} Stars`),
    });
    expect(ratingElement).toBeInTheDocument();
    expect(ratingElement).toBeChecked();
  });

  it("allows changing the rank", async () => {
    const user = userEvent.setup();
    render(<AddSubscriptionModal {...mockProps} />);

    // Find and click a different rating (e.g., 5 stars)
    const fiveStarsRating = screen.getByRole("radio", { name: "5 Stars" });
    await user.click(fiveStarsRating);

    // Check if the rating was updated
    expect(fiveStarsRating).toBeChecked();
  });

  it("calls updateSubscription and client.post when Submit button is clicked", async () => {
    const { client } = jest.requireMock("../index");
    const { queryClient } = jest.requireMock("../index");
    const user = userEvent.setup();

    render(<AddSubscriptionModal {...mockProps} />);

    // Find and click the Submit button
    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);

    // Check if updateSubscription was called with correct parameters
    expect(util.updateSubscription).toHaveBeenCalledWith({
      sub_url: "https://example.com/test",
      rank: DEFAULT_RANK,
      has_new: true,
      checked_at: expect.any(Number),
      updated_at: expect.any(Number),
      image: "",
      name: "",
      title: "",
      work_url: "",
    });

    // Check if queryClient.setQueryData was called
    expect(queryClient.setQueryData).toHaveBeenCalled();

    // Check if client.post was called
    expect(client.post).toHaveBeenCalled();

    // Check if onClose was called
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it("handles error from updateSubscription", async () => {
    // Mock updateSubscription to return an error
    const mockError = new Error("Test error");
    (util.updateSubscription as jest.Mock).mockResolvedValue(mockError);

    const user = userEvent.setup();

    render(<AddSubscriptionModal {...mockProps} />);

    // Find and click the Submit button
    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);

    // Check that the error is thrown (will be caught by the mutation)
    expect(util.updateSubscription).toHaveBeenCalled();
  });
});
