import axios from "axios";
import { Subscription } from "./types";

const TAG_JAPANESE = "6346";

async function getDocument(url: string) {
  try {
    const { data } = await axios.get(url);
    return new DOMParser().parseFromString(data, "text/html");
  } catch (error) {
    return new Error("Failed to fetch the document: " + error);
  }
}

function updateCheckedAt(subscription: Subscription) {
  subscription.checked_at = Date.now();
  return subscription;
}

export async function updateSubscription(subscription: Subscription) {
  try {
    const gallery_document = await getDocument(subscription.sub_url);
    if (gallery_document instanceof Error) return gallery_document;

    //本を取得
    const books = gallery_document.querySelectorAll("div.gallery") ?? [];
    //最新の日本語本を見つける
    const book = Array.from(books).find((book) =>
      (book.getAttribute("data-tags") ?? "").split(" ").includes(TAG_JAPANESE),
    );
    if (!book) return updateCheckedAt(subscription);

    const anchor = book.querySelector("a") as HTMLAnchorElement;
    const bookUrl = anchor?.getAttribute("href") || "";

    // 本のページを開く
    const document = await getDocument(bookUrl);
    if (document instanceof Error) return document;

    //タイトルを取得
    const japaneseTitle = document.querySelector(
      "h2.title span.pretty",
    )?.textContent;
    const englishTitle = document.querySelector(
      "h1.title span.pretty",
    )?.textContent;
    const title = japaneseTitle ?? englishTitle;

    // タイトルが同一であれば更新がないものと扱う
    if (title === subscription.title) return updateCheckedAt(subscription);

    //作者を取得
    const author = document.querySelector("h2.title span.before")?.textContent;

    //情報を更新する
    subscription.name = author ?? "取得失敗";
    subscription.title = title ?? "取得失敗";
    // サブドメインは t1 に統一する
    subscription.image = (
      book.querySelector("img")?.getAttribute("data-src") ?? "undefined"
    ).replace(/https:\/\/t\d+\.([^/]+)/, "https://t1.$1");
    subscription.updated_at = Date.now();
    subscription.work_url = bookUrl;
    subscription.has_new = true;
    subscription.checked_at = Date.now();
    return subscription;
  } catch (error) {
    return new UnexpectedError(error);
  }
}

class UnexpectedError extends Error {
  public readonly error: unknown;
  constructor(error: unknown) {
    super();
    this.error = error;
  }
  public getErrorString(lengthLimit?: number) {
    if (typeof this.error === "object" || typeof this.error !== "string")
      return JSON.stringify(this.error).slice(0, lengthLimit);
    return this.error.slice(0, lengthLimit);
  }
}
