import { createRoot } from "react-dom/client";
import { Root } from "./component";

// skip execution in the loading screen
if (!document.getElementById("challenge-running")) {
  const menu = document.getElementsByTagName("ul").item(0);
  // menuが存在する場合のみ処理を続行
  if (menu) {
    const rootDom = document.createElement("li");
    menu.appendChild(rootDom); // menuが存在するのでOptional Chainingは不要
    createRoot(rootDom).render(Root());
  }
}
