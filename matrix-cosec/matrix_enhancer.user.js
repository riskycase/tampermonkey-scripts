// ==UserScript==
// @name         Matrix Enhancer
// @namespace    http://10.40.20.41/COSEC/Default/Default
// @version      2024-09-19
// @description  Matrix enhancements for the win!
// @author       Hrishikesh Patil <hrishikeshpatil.754@gmail.com>
// @run-at       document-end
// @match        http://10.40.20.41/COSEC/Default/Default
// @match        http://leaveandattendance.tanla.com/COSEC/Default/Default
// @icon         https://www.google.com/s2/favicons?sz=64&domain=20.41
// @updateURL    https://raw.githubusercontent.com/riskycase/tampermonkey-scripts/main/matrix-cosec/matrix_enhancer.user.js
// @downloadURL  https://raw.githubusercontent.com/riskycase/tampermonkey-scripts/main/matrix-cosec/matrix_enhancer.user.js
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @require      http://userscripts-mirror.org/scripts/source/107941.user.js
// ==/UserScript==

(async function () {
  "use strict";

  const IGNORE_DATES_KEY = "ignoreDates";
  const ROW_UPGRADED_ATTRIBUTE = "rowUpgraded";
  const LABEL_UPGRADED_ATTRIBUTE = "labelUpgraded";

  const token = SecurityManager.token;
  const url = new URL(window.location.href);
  const origin = url.origin;
  const now = new Date();
  const dual = now.getDate() > 20;
  const ignoreDates = new Set(
    String(GM_SuperValue.get(IGNORE_DATES_KEY, "17/09/2024")).split(","),
  );
  GM_addStyle(`
        .timeRemaining {
            padding: 4px 8px;
            font-size: smaller;
        }

        .upgraded-label-true:after {
          content: " ✔️"
        }

        .upgraded-label-false:after {
          content: " ❌"
        }
    `);

  window.addEventListener("hashchange", async (event) => {
    await waitForElm("#accordion.EssMenuDivHeight");
    if (!document.getElementById("my_TimeLeft")) {
      const li = document.createElement("li");
      li.id = "my_TimeLeft";
      li.className = "timeRemaining";
      document.querySelector("#accordion.EssMenuDivHeight").appendChild(li);
    }
    if (dual && !document.getElementById("my_TimeLeft2")) {
      const li = document.createElement("li");
      li.id = "my_TimeLeft2";
      li.className = "timeRemaining";
      document.querySelector("#accordion.EssMenuDivHeight").appendChild(li);
      const nextMonth = (now.getMonth() + 1) % 12;
      const nextYear = now.getFullYear() + (nextMonth === 0 ? 1 : 0);
      setTimeout(() => {
        getDataForMonth(nextMonth + 1, nextYear, "my_TimeLeft2");
      }, 500);
    }
    getDataForMonth(now.getMonth() + 1, now.getFullYear(), "my_TimeLeft");
    if (
      event.newURL.startsWith(`${origin}/COSEC/Default/Default#/ESS/12/12050/`)
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

  function getDataForMonth(month, year, id) {
    const previousMonth = ((month + 10) % 12) + 1;
    const previousYear = month === 1 ? year - 1 : year;
    GM_xmlhttpRequest({
      method: "GET",
      url: `${origin}/cosec/api/DailyAttendanceView/getData?MenuId=12050&Type=`,
      headers: {
        Token: token,
      },
      responseType: "json",
      onload: function (response) {
        if (response.response.validation.validate) {
          GM_xmlhttpRequest({
            method: "GET",
            url: `${origin}/cosec/api/DailyAttendanceView/getDataForUserId?IsDatePicker=true&Para1=21%2F${previousMonth
              .toString()
              .padStart(2, "0")}%2F${previousYear}&Para2=20%2F${month
              .toString()
              .padStart(2, "0")}%2F${year}&TemplateId=1&UserID=${
              SecurityManager.username
            }`,
            headers: {
              Token: token,
            },
            responseType: "json",
            onload: function (response) {
              if (response.response.validation.validate) {
                const AttendanceDetail =
                  response.response.result.AttendanceDetail.filter(
                    (day) =>
                      day.Shift === "GS" &&
                      day.FirstHalf !== "EL" &&
                      day.SecondHalf !== "EL" &&
                      !ignoreDates.has(day.DateStr),
                  ).map((attendance) => ({
                    date: new Date(attendance.Date),
                    start: attendance.FirstIN,
                    end: attendance.LastOUT,
                    time: Number(attendance.WorkTime),
                    hours: attendance.WorkHours,
                    dateStr: attendance.DateStr,
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
                  spanContent = `${getMonthName(previousMonth)} extra: ${Math.floor(hours)}:${minutes
                    .toString()
                    .padStart(2, "0")}`;
                } else {
                  const hours = Math.abs(timeLeft) / 60;
                  const minutes = Math.abs(timeLeft) % 60;
                  spanContent = `${getMonthName(previousMonth)} needed: ${Math.floor(hours)}:${minutes
                    .toString()
                    .padStart(2, "0")}`;
                }
                document.getElementById(id).innerText = spanContent;
              }
            },
          });
        }
      },
    });
    if (
      window.location.href.startsWith(
        `${origin}/COSEC/Default/Default#/ESS/12/12050/`,
      )
    ) {
      setTimeout(async () => {
        await waitForElm("#grid1.addScrolling");
        markIgnored();
        const observer = new MutationObserver((mutations) => {
          markIgnored();
          observer.disconnect();
        });
        observer.observe(document.querySelector("#grid1.addScrolling"), {
          childList: true,
          subtree: true,
        });
      }, 0);
    }
  }

  function markIgnored() {
    const rows = Array(
      ...document
        .querySelector("tbody.GridBody")
        .querySelectorAll("tr:not(.ng-hide)"),
    ).map((e) => ({
      element: e,
      label: e.querySelector("label"),
      date: e.querySelector("label").innerText,
    }));
    rows.forEach((row) => {
      if (row.element.getAttribute(ROW_UPGRADED_ATTRIBUTE) !== "true") {
        row.element.addEventListener("click", () => {
          if (ignoreDates.has(row.date)) {
            ignoreDates.delete(row.date);
            row.label.classList.remove("upgraded-label-false");
            row.label.classList.add("upgraded-label-true");
          } else {
            ignoreDates.add(row.date);
            row.label.classList.remove("upgraded-label-true");
            row.label.classList.add("upgraded-label-false");
          }
          GM_SuperValue.set(IGNORE_DATES_KEY, Array(ignoreDates).join(","));
          getTime();
        });
      }
      row.element.setAttribute(ROW_UPGRADED_ATTRIBUTE, "true");
      if (row.label.getAttribute(LABEL_UPGRADED_ATTRIBUTE) !== "true") {
        if (ignoreDates.has(row.date)) {
          row.label.classList.remove("upgraded-label-true");
          row.label.classList.add("upgraded-label-false");
        } else {
          row.label.classList.remove("upgraded-label-false");
          row.label.classList.add("upgraded-label-true");
        }
      }
      row.label.setAttribute(LABEL_UPGRADED_ATTRIBUTE, "true");
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
      "my_TimeLeft",
    );
  }

  function getMonthName(month) {
    switch (month) {
      case 0:
        return "Jan";
      case 1:
        return "Feb";
      case 2:
        return "Mar";
      case 3:
        return "Apr";
      case 4:
        return "May";
      case 5:
        return "Jun";
      case 6:
        return "Jul";
      case 7:
        return "Aug";
      case 8:
        return "Sep";
      case 9:
        return "Oct";
      case 10:
        return "Nov";
      case 11:
        return "Dec";
    }
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
