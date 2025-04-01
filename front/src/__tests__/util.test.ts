import { vi, describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
import "@testing-library/jest-dom";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server"; // MSWサーバーをインポート
import {
  galleryHtml,
  bookHtml,
  noJapaneseGalleryHtml,
} from "../mocks/handlers"; // フィクスチャをインポート
import { updateSubscription } from "../util";
import { Subscription } from "../types";

describe("updateSubscription", () => {
  // MSWサーバーのセットアップ (describeブロック内に移動)
  beforeAll(() => server.listen()); // テスト開始前にサーバーを起動

  beforeEach(() => {
    // Date.now()のモックを設定
    vi.spyOn(Date, "now").mockReturnValue(1617235200000); // 2021-04-01T00:00:00.000Z
  });

  afterEach(() => {
    server.resetHandlers(); // 各テスト後にハンドラーをリセット
    vi.restoreAllMocks(); // Date.now() のモックをリセット
  });

  afterAll(() => server.close()); // 全テスト終了後にサーバーを停止

  it("新しい本が見つかった場合、購読情報を更新する", async () => {
    // テスト用の購読情報
    const subscription: Subscription = {
      sub_url: "https://example.com/artist",
      work_url: "https://example.com/old-book",
      title: "古いタイトル",
      image: "https://t1.example.com/old-image.jpg",
      updated_at: 1000000000000,
      checked_at: 1000000000000,
      name: "古い作者名",
      rank: 3,
      has_new: false,
    };

    // MSWハンドラーを設定
    server.use(
      http.get(subscription.sub_url, () => {
        return HttpResponse.text(galleryHtml);
      }),
      http.get("https://example.com/book/123", () => {
        return HttpResponse.text(bookHtml);
      }),
    );

    // 関数を実行
    const result = await updateSubscription(subscription);

    // 結果を検証
    expect(result).toEqual({
      ...subscription,
      title: "日本語タイトル",
      name: "Author Name",
      image: "https://t1.example.com/galleries/123/thumbnail.jpg",
      work_url: "https://example.com/book/123",
      has_new: true,
      updated_at: 1617235200000,
      checked_at: 1617235200000,
    });
  });

  it("タイトルが同じ場合、更新がないものとして扱う", async () => {
    // テスト用の購読情報（タイトルが日本語タイトルと同じ）
    const subscription: Subscription = {
      sub_url: "https://example.com/artist",
      work_url: "https://example.com/book/123",
      title: "日本語タイトル", // 既に最新のタイトル
      image: "https://t1.example.com/galleries/123/thumbnail.jpg",
      updated_at: 1000000000000,
      checked_at: 1000000000000,
      name: "Author Name",
      rank: 3,
      has_new: false,
    };

    // MSWハンドラーを設定
    server.use(
      http.get(subscription.sub_url, () => {
        return HttpResponse.text(galleryHtml);
      }),
      http.get("https://example.com/book/123", () => {
        return HttpResponse.text(bookHtml);
      }),
    );

    // 関数を実行
    const result = await updateSubscription(subscription);

    // 結果を検証（checked_atのみ更新される）
    expect(result).toEqual({
      ...subscription,
      checked_at: 1617235200000,
    });
  });

  it("日本語の本が見つからない場合、checked_atのみ更新する", async () => {
    // テスト用の購読情報
    const subscription: Subscription = {
      sub_url: "https://example.com/artist",
      work_url: "https://example.com/old-book",
      title: "古いタイトル",
      image: "https://t1.example.com/old-image.jpg",
      updated_at: 1000000000000,
      checked_at: 1000000000000,
      name: "古い作者名",
      rank: 3,
      has_new: false,
    };

    // MSWハンドラーを設定
    server.use(
      http.get(subscription.sub_url, () => {
        return HttpResponse.text(noJapaneseGalleryHtml);
      }),
    );

    // 関数を実行
    const result = await updateSubscription(subscription);

    // 結果を検証（checked_atのみ更新される）
    expect(result).toEqual({
      ...subscription,
      checked_at: 1617235200000,
    });

    // MSWではリクエストが成功したかどうかで検証するため、呼び出し回数の確認は不要
  });

  it("ドキュメントの取得に失敗した場合、エラーを返す", async () => {
    // テスト用の購読情報
    const subscription: Subscription = {
      sub_url: "https://example.com/artist",
      work_url: "https://example.com/old-book",
      title: "古いタイトル",
      image: "https://t1.example.com/old-image.jpg",
      updated_at: 1000000000000,
      checked_at: 1000000000000,
      name: "古い作者名",
      rank: 3,
      has_new: false,
    };

    // MSWハンドラーを設定 (ネットワークエラーをシミュレート)
    server.use(
      http.get(subscription.sub_url, () => {
        return HttpResponse.error(); // ネットワークエラーを返す
      }),
    );

    // 関数を実行
    const result = await updateSubscription(subscription);

    // 結果を検証（エラーが返される）
    expect(result).toBeInstanceOf(Error);
    expect((result as Error).message).toContain("Failed to fetch the document");
  });
});
