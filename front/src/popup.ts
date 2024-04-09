import "webextension-polyfill/dist/browser-polyfill.js";
import { runtime, tabs } from "webextension-polyfill";

tabs.create({ url: runtime.getURL("index.html") });
window.close();
