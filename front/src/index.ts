console.log("main");

import { createRoot } from "react-dom/client";
import { Main } from "./main";
import axios from "axios";
const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");
createRoot(root).render(Main());

axios.get("https://nowsecure.nl/");
