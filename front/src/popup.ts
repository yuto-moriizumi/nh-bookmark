import { runtime } from "webextension-polyfill";
import "webextension-polyfill/dist/browser-polyfill.js";
// import { runtime, tabs } from "webextension-polyfill";
// import axios from "axios";

// tabs.create({ url: runtime.getURL("index.html") });
// window.close();

// axios.get("https://nowsecure.nl/");
// fetch("https://nowsecure.nl/");

runtime.sendMessage({
  message: "contextscript.jsからbackground.jsに送るメッセージ",
});
