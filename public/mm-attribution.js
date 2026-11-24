/* Mystical Messages — first-touch attribution capture.
 *
 * Loaded (deferred) by BOTH public/landing.html (the "/" page, which has no
 * React) and index.html (the app shell). localStorage is shared across the
 * whole site, so tags captured on "/" survive the click through to /login.
 *
 * Saves one object under localStorage key "mm_attribution":
 *   utm_source, utm_medium, utm_campaign, utm_content, utm_term,
 *   first_referrer (other-site referrer, no query string), in_app_browser,
 *   ts (ISO time of capture)
 *
 * First-touch rule: save only if nothing is stored yet, or if what is stored
 * has no UTM tags and this visit does. A blank visit never overwrites a tag.
 * The URL is never modified. Every storage call is wrapped in try/catch, and
 * nothing here can throw into the page.
 *
 * Also saves a ?ref= referral code to "mm_ref_code" (same key and format the
 * app already uses) so referral links work when they land on "/".
 */
(function () {
  var KEY = "mm_attribution";
  var REF_KEY = "mm_ref_code";
  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  var MAX = 200;

  function clean(v, lower) {
    if (typeof v !== "string") return "";
    v = v.replace(/^\s+|\s+$/g, "").slice(0, MAX);
    return lower ? v.toLowerCase() : v;
  }

  function getParam(search, name) {
    // Small manual parser: works in very old in-app webviews too.
    var q = (search || "").replace(/^\?/, "");
    if (!q) return "";
    var parts = q.split("&");
    for (var i = 0; i < parts.length; i++) {
      var eq = parts[i].indexOf("=");
      var k = eq === -1 ? parts[i] : parts[i].slice(0, eq);
      if (k !== name) continue;
      var val = eq === -1 ? "" : parts[i].slice(eq + 1);
      try { return decodeURIComponent(val.replace(/\+/g, " ")); } catch (e) { return val; }
    }
    return "";
  }

  function hasUtm(o) {
    if (!o) return false;
    for (var i = 0; i < UTM_KEYS.length; i++) if (o[UTM_KEYS[i]]) return true;
    return false;
  }

  function detectInApp(ua) {
    ua = ua || "";
    if (/Instagram/i.test(ua)) return "instagram";
    if (/FBAN|FBAV|FB_IAB/i.test(ua)) return "facebook";
    if (/TikTok|musical_ly|Bytedance/i.test(ua)) return "tiktok";
    return "";
  }

  function otherSiteReferrer(ref, hostname) {
    if (!ref) return "";
    var m = /^https?:\/\/([^\/?#:]+)[^?#]*/i.exec(ref);
    if (!m) return "";
    var host = m[1].toLowerCase();
    var mine = (hostname || "").toLowerCase().replace(/^www\./, "");
    if (host.replace(/^www\./, "") === mine) return "";
    if (mine && host.slice(-(mine.length + 1)) === "." + mine) return ""; // subdomain of ours
    return m[0].slice(0, MAX); // origin + path, no query string or hash
  }

  try {
    var loc = window.location;
    var search = loc.search;

    // 1) Referral code (same behaviour as the app's own capture in App.jsx).
    try {
      var ref = getParam(search, "ref");
      if (ref) window.localStorage.setItem(REF_KEY, ref.replace(/^\s+|\s+$/g, "").toUpperCase().slice(0, 64));
    } catch (e) {}

    // 2) Attribution.
    var visit = { ts: new Date().toISOString() };
    for (var i = 0; i < UTM_KEYS.length; i++) {
      var k = UTM_KEYS[i];
      visit[k] = clean(getParam(search, k), k === "utm_source" || k === "utm_medium");
    }
    visit.first_referrer = otherSiteReferrer(document.referrer, loc.hostname);
    visit.in_app_browser = detectInApp(navigator.userAgent);

    var hasSignal = hasUtm(visit) || visit.first_referrer || visit.in_app_browser;
    if (!hasSignal) return; // fully blank visit: nothing worth saving

    var existing = null;
    try {
      var raw = window.localStorage.getItem(KEY);
      if (raw) existing = JSON.parse(raw);
    } catch (e) { existing = null; }

    var shouldSave = !existing || (!hasUtm(existing) && hasUtm(visit));
    if (!shouldSave) return;

    try { window.localStorage.setItem(KEY, JSON.stringify(visit)); } catch (e) {}
  } catch (e) {
    /* never break the page */
  }
})();
