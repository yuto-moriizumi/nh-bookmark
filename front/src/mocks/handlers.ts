// src/mocks/handlers.js
import { readFileSync } from "fs";
import { join } from "path";

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

// ここにテストで使用するデフォルトのハンドラーを定義します
// 必要に応じてテストケース内で server.use() を使って上書きします
export const handlers = [
  // デフォルトのハンドラーは空にしておき、各テストで必要なものを設定する方針も可能です
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
