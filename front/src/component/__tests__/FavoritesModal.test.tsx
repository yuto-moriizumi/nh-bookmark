import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FavoritesModal } from "../FavoritesModal";
import { server } from "../../mocks/server";
import { http, HttpResponse } from "msw";
import { Subscription } from "../../types";
import { vi } from "vitest";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const mockSubscriptions: Subscription[] = [
  {
    sub_url: "http://example.com/1",
    work_url: "http://example.com/work1",
    title: "Test Subscription 1",
    image: "http://example.com/thumb1.jpg",
    updated_at: Date.now() - 1000 * 60 * 30, // 30 mins ago
    checked_at: Date.now() - 1000 * 60 * 60 * 3, // 3 hours ago - OLDEST CHECKED
    name: "Author 1",
    rank: 10,
    has_new: true,
  },
  {
    sub_url: "http://example.com/2",
    work_url: "http://example.com/work2",
    title: "Test Subscription 2",
    image: "http://example.com/thumb2.jpg",
    updated_at: Date.now() - 1000 * 60 * 90, // 90 mins ago
    checked_at: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    name: "Author 2",
    rank: 5,
    has_new: false,
  },
];

const updatedSubscriptionData = {
  title: "Updated Title 1",
  updated_at: expect.any(Number),
  checked_at: expect.any(Number),
  has_new: true,
};


vi.mock("../../util", () => ({
  updateSubscription: vi.fn(async (sub: Subscription) => {
    if (sub.sub_url === mockSubscriptions[0].sub_url) {
      return Promise.resolve({
        ...sub,
        title: updatedSubscriptionData.title,
        updated_at: Date.now(),
        checked_at: Date.now(),
        has_new: updatedSubscriptionData.has_new,
      });
    }
    if (sub.sub_url === mockSubscriptions[1].sub_url) {
      return Promise.resolve({
        ...sub,
        updated_at: Date.now(),
        checked_at: Date.now(),
      });
    }
    return Promise.resolve(sub);
  }),
}));


let updateSubscription: typeof import("../../util").updateSubscription;

describe("FavoritesModal", () => {
  beforeAll(() => server.listen());
  beforeEach(async () => {
    updateSubscription = (await import("../../util")).updateSubscription;
    const baseUrl =
      "https://63bft8o202.execute-api.ap-northeast-1.amazonaws.com";
    server.use(
      http.get(`${baseUrl}/subscriptions`, () => {
        return HttpResponse.json({ subscriptions: mockSubscriptions });
      }),
      http.post(`${baseUrl}/subscriptions`, async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json(body, { status: 200 });
      }),
    );
  });
  afterEach(() => {
    server.resetHandlers();
    queryClient.clear();
    vi.clearAllMocks();
  });
  afterAll(() => server.close());

  const renderComponent = (open: boolean, onClose = vi.fn()) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <FavoritesModal open={open} onClose={onClose} />
      </QueryClientProvider>,
    );
  };

  test("モーダルが開いていないときは何も表示しない", () => {
    renderComponent(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("モーダルが開いているとき、サブスクリプションを表示する", async () => {
    renderComponent(true);

    await waitFor(() => {
      expect(screen.getByText("Test Subscription 1")).toBeInTheDocument();
      expect(screen.getByText("Test Subscription 2")).toBeInTheDocument();
    });

    const cards = screen.getAllByRole("article");
    expect(cards[0]).toHaveTextContent("Test Subscription 1");
    expect(cards[1]).toHaveTextContent("Test Subscription 2");
  });

  test("データ取得に失敗した場合、エラーを表示しない（コンソールにはエラーが出る）", async () => {
    const baseUrl =
      "https://63bft8o202.execute-api.ap-northeast-1.amazonaws.com";
    server.use(
      http.get(`${baseUrl}/subscriptions`, () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    renderComponent(true);

    await waitFor(() => {
      expect(screen.getByRole("presentation")).toBeInTheDocument();
    });

    expect(screen.getByRole("presentation")).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });

  test("自動更新がトリガーされる", async () => {
    renderComponent(true);

    await waitFor(() => {
      expect(screen.getByText("Test Subscription 1")).toBeInTheDocument();
      expect(screen.getByText("Test Subscription 2")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(updateSubscription).toHaveBeenCalled();
    });
    expect(updateSubscription).toHaveBeenCalledWith(mockSubscriptions[0]);

    await waitFor(() => {
      expect(updateSubscription).toHaveBeenCalledTimes(2);
    });
    expect(updateSubscription).toHaveBeenNthCalledWith(2, mockSubscriptions[1]);

    await waitFor(() => {
      expect(updateSubscription).toHaveBeenCalledTimes(2);
    });
  });
});
