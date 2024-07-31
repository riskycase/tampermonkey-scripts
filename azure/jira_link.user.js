// ==UserScript==
// @name         Link Azure to JIRA - Tanla only!
// @namespace    http://tampermonkey.net/
// @version      2024-07-31
// @description  Replace JIRA ticket codes with links to corresponding tickets
// @author       Hrishikesh Patil <hrishikeshpatil.754@gmail.com>
// @match        https://dev.azure.com.mcas.ms/karixrepo/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mcas.ms
// @updateURL    https://raw.githubusercontent.com/riskycase/tampermonkey-scripts/main/azure/jira_link.user.js
// @downloadURL  https://raw.githubusercontent.com/riskycase/tampermonkey-scripts/main/azure/jira_link.user.js
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const jiraTags = [
    "ANT",
    "APP",
    "ATP",
    "AUT",
    "CCM",
    "CI",
    "CMP",
    "CMS",
    "CON",
    "CTB",
    "DIGSMS",
    "EMAIL",
    "ENG",
    "IR",
    "ITNW",
    "ITPS",
    "MTW",
    "NIC",
    "RCM",
    "RISK",
    "SERVICES",
    "SHF",
    "TD",
    "TGR",
    "TP",
    "TRP",
    "TS",
    "UCPARCH",
    "UPSMS",
    "UPVOICE",
    "VOIC",
    "VP",
    "WCM",
    "WIS",
    "WMP",
    "WXT",
  ];

  const observer = new MutationObserver((mutations) => {
    jiraTags.forEach((tag) => {
      const elements = document.evaluate(
        `//*[contains(text(), "${tag}")]`,
        document,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      );
      for (var i = 0; i < elements.snapshotLength; i++) {
        const element = elements.snapshotItem(i);
        if (
          element.hasAttribute("tamperMonkeyLinked") ||
          element.nodeName === "TITLE" ||
          element.nodeName === "SCRIPT" ||
          element.nodeName === "A"
        )
          continue;
        const text = element.innerHTML;
        element.innerHTML = text.replace(
          RegExp(`${tag}(\\D*)(\\d+)`),
          `<a href="https://tanlaplatforms.atlassian.net/browse/${tag}-$2">${tag}$1$2</a>`,
        );
        element.setAttribute("tamperMonkeyLinked", true);
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
