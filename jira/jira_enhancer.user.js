// ==UserScript==
// @name         JIRA Improvements - Tanla edition
// @namespace    https://tanlaplatforms.atlassian.net/
// @version      2024-07-23
// @description  Make JIRA better
// @author       Hrishikesh Patil <hrishikeshpatil.754@gmail.com>
// @match        https://tanlaplatforms.atlassian.net/*
// @updateURL    https://raw.githubusercontent.com/riskycase/tampermonkey-scripts/main/matrix-cosec/jira_enhancer.user.js
// @downloadURL  https://raw.githubusercontent.com/riskycase/tampermonkey-scripts/main/matrix-cosec/jira_enhancer.user.js
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_addStyle
// ==/UserScript==

(async function () {
  "use strict";

  function waitForElm(selector) {
    return new Promise((resolve) => {
      if (document.querySelector(selector)) {
        return resolve(document.querySelector(selector));
      }

      const observer = new MutationObserver((mutations) => {
        if (document.querySelector(selector)) {
          observer.disconnect();
          resolve(document.querySelector(selector));
        }
      });

      // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  }

  let styleElement = GM_addStyle("");

  let rightPanel = true;

  function updateStyle() {
    styleElement.remove();
    styleElement = GM_addStyle(`
        :root {
            --bannerHeight: 0px!important;
        }

        [data-ds--page-layout--slot=banner] {
            display: none;
        }

        [data-testid="issue.views.issue-details.issue-layout.container-right"] {
            display: ${rightPanel ? "block" : "none"};
        }
    `);
  }

  updateStyle();

  await waitForElm(
    '[data-component-selector="jira-issue-view-common-component-resize-handle"]',
  );

  document
    .querySelector(
      '[data-component-selector="jira-issue-view-common-component-resize-handle"]',
    )
    .addEventListener("click", (_) => {
      rightPanel = !rightPanel;
      updateStyle();
    });
})();
