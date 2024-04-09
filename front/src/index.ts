import { createRoot } from "react-dom/client";
import { Main } from "./main";

async function main() {
  setInterval(() => {
    const container = document.getElementById("paratranz-helper-container");
    if (container !== null) return;
    const translationArea = document
      .getElementsByClassName("translation-area")
      .item(0);
    if (translationArea === null) return;
    const rootDom = document.createElement("div");
    rootDom.id = "paratranz-helper-container";
    translationArea.parentNode?.insertBefore(
      rootDom,
      translationArea.nextSibling,
    );
    console.log("create rootDom");
    const root = createRoot(rootDom);
    root.render(Main());

    // unmount when rootDom is removed
    const observer = new MutationObserver((mutationsList) => {
      const isRootRemoved = mutationsList.some((mutation) =>
        [...mutation.removedNodes].some((node) => node.contains(rootDom)),
      );
      if (!isRootRemoved) return;
      root.unmount();
      observer.disconnect();
    });
    observer.observe(document, { childList: true, subtree: true });
  }, 500);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}
