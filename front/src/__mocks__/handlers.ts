// src/mocks/handlers.js
import { readFileSync } from "fs";
import { join } from "path";
import { http, HttpResponse } from "msw";

// テスト用のフィクスチャを読み込む
const galleryHtml = readFileSync(
  join(__dirname, "../__tests__/__fixtures__/gallery.html"),
  "utf8",
);
const bookHtml = readFileSync(
  join(__dirname, "../__tests__/__fixtures__/book.html"),
  "utf8",
);
const noJapaneseGalleryHtml = readFileSync(
  join(__dirname, "../__tests__/__fixtures__/no_japanese_gallery.html"),
  "utf8",
);

// Mock data matching the actual Subscription type
const mockApiSubscriptions = [
  {
    sub_url: "http://example.com/1",
    work_url: "http://example.com/work1",
    title: "Test Subscription 1",
    image: "http://example.com/thumb1.jpg",
    updated_at: Date.now() - 1000 * 60 * 30, // 30 mins ago (number timestamp)
    checked_at: Date.now() - 1000 * 60 * 60 * 3, // 3 hours ago (number timestamp) - OLDEST
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

// ここにテストで使用するデフォルトのハンドラーを定義します
// 必要に応じてテストケース内で server.use() を使って上書きします
export const handlers = [
  // GET /api/subscriptions
  http.get("/api/subscriptions", () => {
    // Return data structured as { subscriptions: [...] } based on test file mock
    return HttpResponse.json({ subscriptions: mockApiSubscriptions });
  }),

  // OPTIONS /api/subscriptions (CORS preflight - might still be needed depending on client)
  http.options("/api/subscriptions", () => {
    return new HttpResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }),

  // POST /api/subscriptions (Used by updateSubscription via client.post)
  http.post("/api/subscriptions", async ({ request }) => {
    const updatedSub = await request.json();
    // Simulate successful update, return the updated subscription
    // Ensure the returned structure matches the Subscription type
    return HttpResponse.json({
      ...(updatedSub as Record<string, unknown>), // Assume input matches structure
      // Simulate server setting timestamps
      updated_at: Date.now(),
      checked_at: Date.now(),
    });
  }),

  // Note: PUT and DELETE handlers removed as they don't seem used by FavoritesModal tests
  // Add them back if needed, ensuring they use the correct path and data structure.

  // 他のテストで使われる可能性のあるハンドラも追加しておく
  // 例:
  // http.get('https://example.com/artist', () => {
  //   return HttpResponse.text(galleryHtml);
  // }),
  // http.get('https://example.com/book/123', () => {
  //   return HttpResponse.text(bookHtml);
  // }),
];

// テストフィクスチャをエクスポートしてテストファイルで利用できるようにします
export { galleryHtml, bookHtml, noJapaneseGalleryHtml };
