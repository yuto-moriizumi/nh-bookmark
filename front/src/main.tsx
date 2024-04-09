import { useEffect, useState } from "react";
import axios, { AxiosResponse } from "axios";
import { ApiRequest, ApiResponse } from "common";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { DictUpdateButton } from "./DictUpdateButton";

export const queryClient = new QueryClient();

export function Main() {
  return (
    <QueryClientProvider client={queryClient}>
      <Sub />
    </QueryClientProvider>
  );
}

const getKey = () =>
  document
    .getElementsByTagName("tbody")
    .item(0)
    ?.children.item(0)
    ?.children.item(1)?.textContent ?? "";

const getOriginalText = () =>
  document.getElementsByClassName("original well").item(0)?.textContent ?? "";

function Sub() {
  const [originalText, setOriginalText] = useState("");
  const [key, setKey] = useState("");

  const { data, status } = useQuery({
    queryKey: ["translation", originalText, key],
    staleTime: 1000 * 60, // 60 sec
    queryFn: async () => {
      if (originalText === "") return "";
      // 既に同一テキストが翻訳済みの場合は、翻訳済みテキストを取得する
      const translation = await getPastTranslation();
      if (translation) return translation;
      const mode = getMode(key);
      const translated = await translate(originalText, mode === "adjective");
      return (mode === "definition" ? "the " : "") + translated;
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setOriginalText(getOriginalText());
      setKey(getKey().trim());
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <p>
        {status === "pending"
          ? "翻訳中…"
          : status === "error"
            ? "翻訳APIエラー"
            : data}
      </p>
      <div style={{ writingMode: "vertical-lr" }}>
        <button
          onClick={() => {
            const textarea = document
              .getElementsByClassName("translation form-control")
              .item(0) as HTMLTextAreaElement;
            textarea.value = data ?? "";
            textarea.dispatchEvent(new InputEvent("input", { data }));
          }}
        >
          挿入
        </button>
        <DictUpdateButton />
      </div>
    </div>
  );
}

function getMode(key: string) {
  if (key.endsWith("DEF:0")) return "definition";
  if (key.endsWith("ADJ:0")) return "adjective";
  return "normal";
}

async function translate(text: string, isAdjectiveCountryName: boolean) {
  const { data } = await axios.post<
    ApiResponse,
    AxiosResponse<ApiResponse>,
    ApiRequest
  >("https://1thrt62esf.execute-api.ap-northeast-1.amazonaws.com/translate", {
    text,
    isAdjectiveCountryName,
  });
  return data.text;
}

/** 既に同一テキストが翻訳済みの場合は、翻訳済みテキストを取得する */
async function getPastTranslation() {
  while (document.getElementsByClassName("loading").item(0)) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const translation = document.getElementsByClassName("string-item").item(0);
  if (translation === null) return;
  const matchRateString =
    translation.children.item(0)?.children.item(0)?.textContent ?? undefined;
  if (matchRateString === undefined) return;
  const matchRateStr = matchRateString.match(/([\d\\.]+)%/)?.[1] ?? "0";
  const matchRate = parseFloat(matchRateStr);
  if (matchRate < 100) return undefined;
  return (
    translation.getElementsByClassName("translation notranslate").item(0)
      ?.textContent ?? undefined
  );
}
