import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SubscriptionCard, DEFAULT_RANK } from "../SubscriptionCard";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { OptionalSubscription } from "../../types";
import { client } from "../index"; // Import directly

// Mock the queryClient and client
vi.mock("../index", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../index")>();
  return {
    ...actual,
    queryClient: {
      setQueryData: vi.fn(),
    },
    client: {
      post: vi.fn().mockResolvedValue({ data: {} }),
    },
  };
});

// Mock the MutationSnackbar component
vi.mock("../MutationSnackbar", () => ({
  MutationSnackbar: vi.fn(() => null),
}));

// Mock the Modal component
vi.mock("../Modal", () => ({
  // Modalコンポーネントのモックを修正し、openとonCloseを受け取るようにする
  Modal: vi.fn(({ children, open, onClose }) =>
    open ? ( // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
      <div data-testid="modal" onClick={onClose}>
        {children}
      </div>
    ) : null,
  ),
}));

// describe.only を describe に変更
describe("SubscriptionCard Component", () => {
  // テスト用のQueryClientを作成
  let queryClientTest: QueryClient;
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClientTest}>
      {children}
    </QueryClientProvider>
  );

  const mockSubscription: OptionalSubscription = {
    sub_url: "https://example.com/test",
    image: "https://example.com/image.jpg",
    title: "Test Title",
    has_new: true,
    rank: 4,
  };

  beforeEach(() => {
    // 各テストの前にQueryClientを初期化
    queryClientTest = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // テストではリトライを無効化
        },
      },
    });
    vi.clearAllMocks();
  });

  it("renders subscription details correctly", () => {
    // renderにwrapperを追加
    render(<SubscriptionCard subscription={mockSubscription} />, { wrapper });

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
    // renderにwrapperを追加
    render(<SubscriptionCard subscription={subscription} />, { wrapper });

    expect(screen.getByText("READ")).toBeInTheDocument();
  });

  it("renders with default rank when rank is not provided", () => {
    const subscription = { ...mockSubscription, rank: undefined };
    // renderにwrapperを追加
    render(<SubscriptionCard subscription={subscription} />, { wrapper });

    // Check if rating component has the default value (英語のアクセシブルネームを使用)
    const ratingElement = screen.getByRole("radio", {
      name: `${DEFAULT_RANK} Stars`, // 英語のアクセシブルネーム
    });
    expect(ratingElement).toBeInTheDocument();
    expect(ratingElement).toBeChecked();
  });

  it("opens delete confirmation modal when delete button is clicked", async () => {
    const user = userEvent.setup();
    // renderにwrapperを追加
    render(<SubscriptionCard subscription={mockSubscription} />, { wrapper });

    // Find and click the delete button by finding the icon inside it
    const deleteIcon = screen.getByTestId("DeleteForeverIcon");
    const deleteButton = deleteIcon.closest("button");
    if (!deleteButton) {
      throw new Error("Could not find the delete button");
    }
    await user.click(deleteButton);

    // Check if modal is opened with confirmation message
    const modal = screen.getByTestId("modal");
    expect(modal).toBeInTheDocument();
    expect(screen.getByText("本当に削除しますか？")).toBeInTheDocument();
  });

  it("calls updateNew mutation when NEW/READ button is clicked", async () => {
    // Use the directly imported mocked client
    const user = userEvent.setup();

    // renderにwrapperを追加
    render(<SubscriptionCard subscription={mockSubscription} />, { wrapper });

    // Find and click the NEW button
    const newButton = screen.getByText("NEW");
    await user.click(newButton);

    // Check if client.post was called with correct parameters
    expect(client.post).toHaveBeenCalledWith("/subscriptions/patch", {
      url: mockSubscription.sub_url,
      has_new: false,
    });
  });

  // it.only を it に変更
  it("calls updateRank mutation when rating is changed", async () => {
    // Use the directly imported mocked client
    // renderを実行 (containerの取得を削除)
    render(<SubscriptionCard subscription={mockSubscription} />, { wrapper });

    // AddSubscriptionModal.test.tsx を参考に、テキストからラベルを探す
    const twoStarsText = screen.getByText("2 Stars"); // アクセシブルネームのテキストを探す
    const twoStarsLabel = twoStarsText.closest("label"); // 親のラベルを取得
    if (!twoStarsLabel) {
      throw new Error("Could not find the label associated with '2 Stars'");
    }
    // fireEventを使ってlabelをクリックする
    fireEvent.click(twoStarsLabel);

    // waitFor を使用して非同期呼び出しを待つ
    await waitFor(() => {
      // Check if client.post was called with correct parameters
      expect(client.post).toHaveBeenCalledWith("/subscriptions/patch", {
        url: mockSubscription.sub_url,
        rank: 2,
      });
    });
  });

  // it.only を it に変更 (describeから.onlyを削除したので不要だが念のため)
  it("calls deleteSubscription mutation when delete is confirmed", async () => {
    // Use the directly imported mocked client
    const user = userEvent.setup();

    // renderにwrapperを追加
    render(<SubscriptionCard subscription={mockSubscription} />, { wrapper });

    // Open the delete modal by finding the icon
    const deleteIcon = screen.getByTestId("DeleteForeverIcon");
    const deleteButton = deleteIcon.closest("button");
    if (!deleteButton) {
      throw new Error("Could not find the delete button to open modal");
    }
    await user.click(deleteButton);

    // Confirm deletion using getByText as suggested
    // モーダル内の削除ボタンをテキストで取得
    const confirmDeleteButton = screen.getByText("Delete");
    await user.click(confirmDeleteButton);

    // Check if client.post was called with correct parameters
    expect(client.post).toHaveBeenCalledWith("/subscriptions/delete", {
      url: mockSubscription.sub_url,
    });
  });
});
