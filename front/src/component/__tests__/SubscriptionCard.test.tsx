import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubscriptionCard, DEFAULT_RANK } from "../SubscriptionCard";
import { OptionalSubscription } from "../../types";

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
  Modal: jest.fn(({ children }) => <div data-testid="modal">{children}</div>),
}));

describe.skip("SubscriptionCard Component", () => {
  const mockSubscription: OptionalSubscription = {
    sub_url: "https://example.com/test",
    image: "https://example.com/image.jpg",
    title: "Test Title",
    has_new: true,
    rank: 4,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders subscription details correctly", () => {
    render(<SubscriptionCard subscription={mockSubscription} />);

    // Check if title is rendered
    expect(screen.getByText("Test Title")).toBeInTheDocument();

    // Check if URL is rendered
    expect(screen.getByText("https://example.com/test")).toBeInTheDocument();

    // Check if image is rendered with correct src
    const image = screen.getByAltText("https://example.com/test");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "https://example.com/image.jpg");

    // Check if NEW button is rendered (since has_new is true)
    expect(screen.getByText("NEW")).toBeInTheDocument();
  });

  it("renders READ button when has_new is false", () => {
    const subscription = { ...mockSubscription, has_new: false };
    render(<SubscriptionCard subscription={subscription} />);

    expect(screen.getByText("READ")).toBeInTheDocument();
  });

  it("renders with default rank when rank is not provided", () => {
    const subscription = { ...mockSubscription, rank: undefined };
    render(<SubscriptionCard subscription={subscription} />);

    // Check if rating component has the default value
    const ratingElement = screen.getByRole("radio", {
      name: new RegExp(`${DEFAULT_RANK} Stars`),
    });
    expect(ratingElement).toBeInTheDocument();
    expect(ratingElement).toBeChecked();
  });

  it("opens delete confirmation modal when delete button is clicked", async () => {
    const user = userEvent.setup();
    render(<SubscriptionCard subscription={mockSubscription} />);

    // Find and click the delete button
    const deleteButton = screen.getByRole("button", { name: /delete/i });
    await user.click(deleteButton);

    // Check if modal is opened with confirmation message
    const modal = screen.getByTestId("modal");
    expect(modal).toBeInTheDocument();
    expect(screen.getByText("本当に削除しますか？")).toBeInTheDocument();
  });

  it("calls updateNew mutation when NEW/READ button is clicked", async () => {
    // Import client from the mock
    const { client } = jest.requireMock("../index");
    const user = userEvent.setup();

    render(<SubscriptionCard subscription={mockSubscription} />);

    // Find and click the NEW button
    const newButton = screen.getByText("NEW");
    await user.click(newButton);

    // Check if client.post was called with correct parameters
    expect(client.post).toHaveBeenCalledWith("/subscriptions/patch", {
      url: mockSubscription.sub_url,
      has_new: false,
    });
  });

  it("calls updateRank mutation when rating is changed", async () => {
    // Import client from the mock
    const { client } = jest.requireMock("../index");
    const user = userEvent.setup();

    render(<SubscriptionCard subscription={mockSubscription} />);

    // Find and click a different rating (e.g., 2 stars)
    const twoStarsRating = screen.getByRole("radio", { name: "2 Stars" });
    await user.click(twoStarsRating);

    // Check if client.post was called with correct parameters
    expect(client.post).toHaveBeenCalledWith("/subscriptions/patch", {
      url: mockSubscription.sub_url,
      rank: 2,
    });
  });

  it("calls deleteSubscription mutation when delete is confirmed", async () => {
    // Import client from the mock
    const { client } = jest.requireMock("../index");
    const user = userEvent.setup();

    render(<SubscriptionCard subscription={mockSubscription} />);

    // Open the delete modal
    const deleteButton = screen.getByRole("button", { name: /delete/i });
    await user.click(deleteButton);

    // Confirm deletion
    const confirmDeleteButton = screen.getByText("Delete");
    await user.click(confirmDeleteButton);

    // Check if client.post was called with correct parameters
    expect(client.post).toHaveBeenCalledWith("/subscriptions/delete", {
      url: mockSubscription.sub_url,
    });
  });
});
