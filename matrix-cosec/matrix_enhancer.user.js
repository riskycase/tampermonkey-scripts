// ==UserScript==
// @name         Matrix Enhancer
// @namespace    http://10.40.20.41/COSEC/Default/Default
// @version      2024-07-18
// @description  Matrix enhancements for the win!
// @author       Hrishikesh Patil <hrishikeshpatil.754@gmail.com>
// @run-at       document-end
// @match        http://10.40.20.41/COSEC/Default/Default
// @icon         https://www.google.com/s2/favicons?sz=64&domain=20.41
// @updateURL    https://raw.githubusercontent.com/riskycase/tampermonkey-scripts/main/matrix-cosec/matrix_enhancer.user.js
// @downloadURL  https://raw.githubusercontent.com/riskycase/tampermonkey-scripts/main/matrix-cosec/matrix_enhancer.user.js
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(async function () {
  "use strict";

  const token = SecurityManager.token;

  window.addEventListener("hashchange", async (event) => {
    const now = new Date();
    await waitForElm(".form-group > label");
    if (!document.getElementById("my_TimeLeft")) {
      const label = document.createElement("label");
      label.id = "my_TimeLeft";
      label.className =
        "form-label control-label mx-input-theme cursor lblRight label-text";
      document
        .querySelector(".form-group > label")
        .parentNode.appendChild(document.createElement("br"));
      document
        .querySelector(".form-group > label")
        .parentNode.appendChild(label);
    }
    getDataForMonth(now.getMonth() + 1, now.getFullYear());
    if (
      event.newURL.startsWith(
        "http://10.40.20.41/COSEC/Default/Default#/ESS/12/12050/",
      )
    ) {
      await waitForElm("#gvDailyAttendancerow1");
      document
        .querySelector("select#month")
        .addEventListener("change", getTime);
      document
        .querySelector("select#TargetYear")
        .addEventListener("change", getTime);
    }
  });

  function getDataForMonth(month, year) {
    const previousMonth = ((month + 10) % 12) + 1;
    const previousYear = month === 1 ? year - 1 : year;
    console.log(`${previousMonth}/${previousYear} - ${month}/${year}`);
    GM_xmlhttpRequest({
      method: "GET",
      url: "http://10.40.20.41/cosec/api/DailyAttendanceView/getData?MenuId=12050&Type=",
      headers: {
        Token: token,
      },
      responseType: "json",
      onload: function (response) {
        if (response.response.validation.validate) {
          GM_xmlhttpRequest({
            method: "GET",
            url: `http://10.40.20.41/cosec/api/DailyAttendanceView/getDataForUserId?IsDatePicker=true&Para1=21%2F${previousMonth.toString().padStart(2, "0")}%2F${previousYear}&Para2=20%2F${month.toString().padStart(2, "0")}%2F${year}&TemplateId=1&UserID=${SecurityManager.username}`,
            headers: {
              Token: token,
            },
            responseType: "json",
            onload: function (response) {
              if (response.response.validation.validate) {
                const AttendanceDetail =
                  response.response.result.AttendanceDetail.filter(
                    (day) => day.Shift === "GS",
                  ).map((attendance) => ({
                    date: new Date(attendance.Date),
                    start: attendance.FirstIN,
                    end: attendance.LastOUT,
                    time: Number(attendance.WorkTime),
                    hours: attendance.WorkHours,
                  }));
                const total = AttendanceDetail.reduce((sum, next) => {
                  return sum + next.time;
                }, 0);
                const workingDays = AttendanceDetail.filter(
                  (day) => day.time !== 0,
                ).length;
                const timeLeft = total - workingDays * 510;
                let spanContent = "";
                if (timeLeft >= 0) {
                  const hours = timeLeft / 60;
                  const minutes = timeLeft % 60;
                  spanContent = `Hours extra: ${Math.floor(hours)}:${minutes.toString().padStart(2, "0")}`;
                } else {
                  const hours = Math.abs(timeLeft) / 60;
                  const minutes = Math.abs(timeLeft) % 60;
                  spanContent = `Hours needed: ${Math.floor(hours)}:${minutes.toString().padStart(2, "0")}`;
                }
                document.getElementById("my_TimeLeft").innerText = spanContent;
              }
            },
          });
        }
      },
    });
  }

  function getMonth(monthString) {
    return Number(monthString.slice(7));
  }

  function getYear(yearString) {
    return Number(yearString.slice(7));
  }

  function getTime() {
    getDataForMonth(
      getMonth(document.querySelector("select#month").value),
      getYear(document.querySelector("select#TargetYear").value),
    );
  }

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
})();
