/* Mystical Messages — Christmas banner for the landing page ("/").
 *
 * Loaded by ONE line at the top of <body> in public/landing.html.
 * To remove the banner: delete that line, or set SHOW_CHRISTMAS_BANNER to false.
 *
 * When it shows (visitor's own local date, current year):
 *   Nov 24 – Dec 23  →  "X days left" countdown to Dec 24
 *   Dec 24           →  "Last chance: Santa's texts go out tonight"
 *   Any other day    →  nothing (the banner is never added to the page)
 *
 * It runs before the rest of the page is drawn, so the page does not jump.
 * Everything is wrapped in try/catch: if anything fails, the landing page
 * simply shows without the banner. Written in old-style JavaScript so it
 * works in in-app browsers (TikTok, Instagram, etc.).
 */
(function () {
  var SHOW_CHRISTMAS_BANNER = true; // ← set to false to turn the banner off

  // Show window, as [month, day]. Months are 1–12.
  var START = [11, 24]; // Nov 24
  var END = [12, 24];   // Dec 24 (last day shown)

  var SIGNUP_URL = "/login?signup=1"; // same link as the hero "Start the Magic" button

  try {
    if (!SHOW_CHRISTMAS_BANNER) return;

    var now = new Date();
    var y = now.getFullYear();
    var today = new Date(y, now.getMonth(), now.getDate());
    var start = new Date(y, START[0] - 1, START[1]);
    var end = new Date(y, END[0] - 1, END[1]);
    if (today < start || today > end) return;

    // Whole days until Dec 24 (Math.round smooths over daylight-saving hours).
    var daysLeft = Math.round((end - today) / 86400000);
    var countdown = daysLeft === 0
      ? "Last chance: Santa’s texts go out tonight"
      : daysLeft + (daysLeft === 1 ? " day left" : " days left");

    var sparkle =
      '<svg class="xb-spk" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path d="M12 0c.7 5.6 5.7 10.6 12 12-6.3 1.4-11.3 6.4-12 12-.7-5.6-5.7-10.6-12-12C6.3 10.6 11.3 5.6 12 0z"/></svg>';

    var css =
      ".xmas-banner{background:#0d1b2a;border-bottom:2px solid #c9933a;color:#fdf8f0;padding:8px 16px 9px}" +
      ".xb-inner{max-width:1040px;margin:0 auto;display:flex;align-items:center;justify-content:center;gap:8px 18px;flex-wrap:wrap}" +
      ".xb-msg{font-family:'Lora',Georgia,serif;font-size:13px;line-height:1.4;color:#fdf8f0;text-align:center;margin:0}" +
      ".xb-row{display:flex;align-items:center;justify-content:center;gap:12px}" +
      ".xb-count{display:inline-flex;align-items:center;gap:6px;font-family:'DM Sans',Arial,sans-serif;font-size:13px;font-weight:600;color:#e8c97a;white-space:nowrap}" +
      ".xb-spk{width:11px;height:11px;fill:#e8c97a;flex-shrink:0}" +
      ".xb-btn{display:inline-block;background:linear-gradient(180deg,#e7b854 0%,#d3922f 100%);color:#20140a;font-family:'DM Sans',Arial,sans-serif;font-size:13px;font-weight:600;line-height:1;padding:9px 14px;border-radius:8px;text-decoration:none;white-space:nowrap}" +
      ".xb-btn:focus-visible{outline:2px solid #fdf8f0;outline-offset:2px}" +
      "@media (max-width:520px){.xmas-banner{padding:6px 12px 7px}.xb-inner{gap:5px 12px}.xb-msg{font-size:12.5px;line-height:1.35;flex-basis:100%}.xb-btn{padding:8px 13px}.xb-count.xb-long{white-space:normal}}";

    var html =
      '<div class="xmas-banner" role="region" aria-label="Christmas announcement">' +
        '<div class="xb-inner">' +
          '<p class="xb-msg">Santa is taking text requests. Schedule his messages before Christmas Eve.</p>' +
          '<div class="xb-row">' +
            '<span class="xb-count' + (daysLeft === 0 ? " xb-long" : "") + '">' + sparkle + countdown + '</span>' +
            '<a class="xb-btn" href="' + SIGNUP_URL + '">✨ Start the Magic</a>' +
          '</div>' +
        '</div>' +
      '</div>';

    var style = document.createElement("style");
    style.appendChild(document.createTextNode(css));
    (document.head || document.getElementsByTagName("head")[0]).appendChild(style);
    document.body.insertAdjacentHTML("afterbegin", html);
  } catch (e) {
    // Never let the banner break the landing page.
  }
})();
