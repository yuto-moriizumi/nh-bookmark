import axios from "axios";
import {
  action,
  runtime,
  tabs,
  //   webRequest,
} from "webextension-polyfill";

action.onClicked.addListener(() => {
  console.log("拡張機能のアイコンがクリックされました");
  fetch("https://nowsecure.nl/");
});
console.log("拡張機awhaerh");

runtime.onMessage.addListener(async (message, sender) => {
  console.log(message.message);

  const tabId = sender.tab?.id;

  console.log("arehahr");
  axios.get("https://nowsecure.nl/", {
    headers: {
      Cookie:
        "cf_clearance=7ENyABrwVoJhTEVxGpDw_d7kOi3S6MtaNpeSnhOZK9I-1712763542-1.0.1.1-IdvKXiKl_Wt1tOQUcz7ViUHCt2oGWOtIlxTr6YpKw9enKJXCeGjhA5CvG10ebvsVzoi2ggqzUBOkbevWBny9Yg",
    },
  });

  if (tabId) {
    // contextscript.jsにメッセージを送信
    await tabs.sendMessage(tabId, {
      message: "background.jsからcontextscript.jsに送るメッセージ",
    });
  }
});
// webRequest.onHeadersReceived.addListener(
//   (details) => {
//     details.responseHeaders?.push({
//       name: "Access-Control-Allow-Origin",
//       value: "*",
//     });
//   },
//   {
//     urls: ["https://nowsecure.nl/*"],
//   },
// );

// declarativeNetRequest.updateDynamicRules({
//   addRules: [
//     {
//       id: 1,
//       priority: 1,
//       action: {
//         type: "modifyHeaders",
//         responseHeaders: [
//           {
//             header: "Access-Control-Allow-Origin",
//             operation: "set",
//             value: "*",
//           },
//         ],
//       },
//       condition: {
//         urlFilter: "https://nowsecure.nl/*",
//         resourceTypes: ["xmlhttprequest"],
//       },
//     },
//   ],
// });
