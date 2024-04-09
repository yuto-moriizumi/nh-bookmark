import { createRoot } from "react-dom/client";
import { Root } from "./component";

const menu = document.getElementsByTagName("ul").item(0);
const rootDom = document.createElement("li");
menu?.appendChild(rootDom);
createRoot(rootDom).render(Root());
