import "@testing-library/jest-dom";
import { readFileSync } from "fs";
import { join } from "path";
import axios from "axios";
import { updateSubscription } from "../util";
import { Subscription } from "../types";

// モックの設定
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("updateSubscription", () => {
  // テスト用のフィクスチャを読み込む
  const galleryHtml = readFileSync(
    join(__dirname, "./__fixtures__/gallery.html"),
    "utf8",
  );
  const bookHtml = readFileSync(
    join(__dirname, "./__fixtures__/book.html"),
    "utf8",
  );
  const noJapaneseGalleryHtml = readFileSync(
    join(__dirname, "./__fixtures__/no_japanese_gallery.html"),
    "utf8",
  );

  beforeEach(() => {
    // テスト前にモックをリセット
    jest.clearAllMocks();

    // Date.now()のモックを設定
    jest.spyOn(Date, "now").mockReturnValue(1617235200000); // 2021-04-01T00:00:00.000Z
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

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

    // axiosのモックを設定
    mockedAxios.get.mockImplementation((url) => {
      if (url === subscription.sub_url) {
        return Promise.resolve({ data: galleryHtml });
      } else if (url === "https://example.com/book/123") {
        return Promise.resolve({ data: bookHtml });
      }
      return Promise.reject(new Error("Unexpected URL"));
    });

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

    // axiosが正しく呼ばれたことを確認
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    expect(mockedAxios.get).toHaveBeenCalledWith(subscription.sub_url);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      "https://example.com/book/123",
    );
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

    // axiosのモックを設定
    mockedAxios.get.mockImplementation((url) => {
      if (url === subscription.sub_url) {
        return Promise.resolve({ data: galleryHtml });
      } else if (url === "https://example.com/book/123") {
        return Promise.resolve({ data: bookHtml });
      }
      return Promise.reject(new Error("Unexpected URL:" + url));
    });

    // 関数を実行
    const result = await updateSubscription(subscription);

    // 結果を検証（checked_atのみ更新される）
    expect(result).toEqual({
      ...subscription,
      checked_at: 1617235200000,
    });

    // axiosが正しく呼ばれたことを確認
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
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

    // axiosのモックを設定
    mockedAxios.get.mockImplementation((url) => {
      if (url === subscription.sub_url) {
        return Promise.resolve({ data: noJapaneseGalleryHtml });
      }
      return Promise.reject(new Error("Unexpected URL:" + url));
    });

    // 関数を実行
    const result = await updateSubscription(subscription);

    // 結果を検証（checked_atのみ更新される）
    expect(result).toEqual({
      ...subscription,
      checked_at: 1617235200000,
    });

    // axiosが正しく呼ばれたことを確認
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(subscription.sub_url);
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

    // axiosのモックを設定（エラーを返す）
    const error = new Error("Network error");
    mockedAxios.get.mockRejectedValue(error);

    // 関数を実行
    const result = await updateSubscription(subscription);

    // 結果を検証（エラーが返される）
    expect(result).toBeInstanceOf(Error);
    expect((result as Error).message).toContain("Failed to fetch the document");

    // axiosが正しく呼ばれたことを確認
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(subscription.sub_url);
  });
});
