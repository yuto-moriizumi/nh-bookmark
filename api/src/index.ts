import express, { json } from "express";
import cors from "cors";
import { GlossaryEntries, Translator } from "deepl-node";
import { ApiRequest, ApiResponse } from "common";
import { decode, encode } from "./utils";

const app = express();

app.get("/", (_, res) => {
  return res.status(200).json({ message: "Hello from root!" });
});

// ミドルウェア設定
app.use(json());
app.use(cors());

app.post<object, ApiResponse, ApiRequest>(
  "/translate",
  async ({ body }, res) => {
    const translator = new Translator(process.env.DEEPL_KEY ?? "");
    const glossaries = await translator.listGlossaries();
    const glossary = glossaries.length > 0 ? glossaries[0] : undefined;

    async function translate(input: string) {
      const { text } = await translator.translateText(input, "ja", "en-US", {
        glossary,
        tagHandling: "html",
        splitSentences: "on",
      });
      return text;
    }

    if (body.isAdjectiveCountryName) {
      const text = await translate(`<p><span>${body.text}</span>国籍</p>`);
      const adjective = text.match(/<span>(.+)<\/span>/)?.[1] ?? text;
      res.send({ text: adjective });
    } else {
      const text = decode(await translate(encode(body.text)));
      res.send({ text: text[0].toUpperCase() + text.slice(1) });
    }
  },
);

type ParatranzTerms = { results: { term: string; translation: string }[] };

// 登録済み辞書全てを削除し、新しい辞書を登録する
app.post("/glossaries", async (req, res) => {
  const translator = new Translator(process.env.DEEPL_KEY ?? "");
  const glossaries = await translator.listGlossaries();
  await Promise.all(
    glossaries.map((glossary) => translator.deleteGlossary(glossary)),
  );

  const terms = (await (
    await fetch(
      "https://paratranz.cn/api/projects/1511/terms?page=1&pageSize=500",
    )
  ).json()) as ParatranzTerms;

  await translator.createGlossary(
    "SSW",
    "ja",
    "en",
    new GlossaryEntries({
      entries: Object.fromEntries(
        terms.results.map((term) => [term.term, term.translation]),
      ),
    }),
  );
  res.status(201).send();
});

app.use((_, res) => {
  return res.status(404).json({ error: "Not Found" });
});

export { app };
