/* The opening: the slogan lands letter by letter like a wave, then fades into the logo.
   It plays once per visit and never loops. The page works in full without it. */
(function () {
  "use strict";

  var LINES = ["Less inbox.", "More day."];
  // Each painted letter's place in the sprite, in em: start, cell width, width it takes up in the line.
  // design/bake-slogan.cjs writes this table.
  var GLYPHS = {"L":[0,1.2083,0.5],"e":[1.2083,1.1146,0.4041],"s":[2.3229,1.0625,0.346],"i":[3.3854,0.9479,0.236],"n":[4.3333,1.25,0.54],"b":[5.5833,1.1875,0.472],"o":[6.7708,1.1563,0.4411],"x":[7.9271,1.1354,0.4261],".":[9.0625,0.9583,0.241],"M":[10.0208,1.6563,0.9421],"r":[11.6771,1.1146,0.4032],"d":[12.7917,1.1458,0.4331],"a":[13.9375,1.1875,0.4701],"y":[15.125,1.1979,0.4891]};
  var STAGGER = 52;        // Gap between letters landing.
  var HOLD_UNTIL = 2350;   // The slogan rests here before it leaves.
  var LOGO_AT = 2950;      // The logo arrives as the last letters clear, so text never overlaps.
  var DONE_AT = 4300;      // Under five seconds, so nobody has to wait for it.

  var root = document.documentElement;
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fromThisSite = document.referrer.indexOf(location.origin) === 0;
  if (calm || fromThisSite || location.hash) return;

  root.classList.add("intro");
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  var timers = [];
  var wave = null;
  var ended = false;

  function later(run, ms) {
    timers.push(window.setTimeout(run, ms));
  }

  function build() {
    var count = 0;
    wave = document.createElement("div");
    wave.className = "wave";
    wave.setAttribute("aria-hidden", "true");
    LINES.forEach(function (line) {
      var row = document.createElement("span");
      row.className = "wave-line";
      line.split(" ").forEach(function (word) {
        var group = document.createElement("span");
        group.className = "wave-word";
        word.split("").forEach(function (letter) {
          var mark = document.createElement("span");
          mark.className = "wave-letter";
          mark.style.setProperty("--i", count);
          mark.style.setProperty("--x", GLYPHS[letter][0]);
          mark.style.setProperty("--w", GLYPHS[letter][1]);
          mark.style.setProperty("--a", GLYPHS[letter][2]);
          count += 1;
          group.appendChild(mark);
        });
        row.appendChild(group);
      });
      wave.appendChild(row);
    });
    wave.style.setProperty("--stagger", STAGGER + "ms");
    document.querySelector(".hero").appendChild(wave);
  }

  function finish() {
    if (ended) return;
    ended = true;
    timers.forEach(window.clearTimeout);
    ["wheel", "touchstart", "pointerdown", "keydown"].forEach(function (name) {
      window.removeEventListener(name, skip);
    });
    root.classList.remove("intro", "intro-play", "intro-out", "intro-logo", "intro-skip");
    if (wave) wave.remove();
  }

  function skip() {
    if (ended) return;
    timers.forEach(window.clearTimeout);
    timers = [];
    root.classList.add("intro-skip", "intro-logo");
    later(finish, 260);
  }

  function start() {
    build();
    root.classList.add("intro-play");
    ["wheel", "touchstart", "pointerdown", "keydown"].forEach(function (name) {
      window.addEventListener(name, skip, { passive: true });
    });
    later(function () { root.classList.add("intro-out"); }, HOLD_UNTIL);
    later(function () { root.classList.add("intro-logo"); }, LOGO_AT);
    later(finish, DONE_AT);
  }

  // Start only once the painted letters have loaded. On a slow link, go straight to the page.
  function whenPaintIsReady() {
    var dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var sprite = new Image();
    sprite.src = "assets/slogan-" + (dark ? "dark" : "light") + ".webp";
    var limit = new Promise(function (done, stop) { window.setTimeout(stop, 2500); });
    return Promise.race([sprite.decode(), limit]);
  }

  // The letters land on the dune, so wait for it too, but never for long.
  function whenDuneIsReady() {
    var dune = document.querySelector(".hero-dunes");
    var limit = new Promise(function (done) { window.setTimeout(done, 1200); });
    return Promise.race([dune.decode().catch(function () {}), limit]);
  }

  var ready = whenPaintIsReady();
  document.addEventListener("DOMContentLoaded", function () {
    Promise.all([ready, whenDuneIsReady()]).then(start, finish);
  });
}());
