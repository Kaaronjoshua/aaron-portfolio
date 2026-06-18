// ======================== PORTRAIT REVEAL ========================
(function () {
  const canvas = document.getElementById("portrait-canvas");
  const ring   = document.getElementById("portrait-cursor-ring");
  const layer2 = document.getElementById("svg-layer2");
  const layer3 = document.getElementById("svg-layer3");

  if (!canvas || !ring || !layer2 || !layer3) return;

  const hero = document.querySelector(".hero");
  const revealLayers = [layer2, layer3];
  const RADIUS         = 110;
  const TRAIL_DURATION = 700;  // ms before a trail blob disappears
  const TRAIL_SPACING  = 10;   // min px moved before recording a trail point

  let activeLayer = null;
  let mouseX = 0, mouseY = 0;
  let blobX  = 0, blobY  = 0;   // smoothly-following blob center
  let currentRadius = 0, targetRadius = 0;
  let rafId = null, isActive = false;
  let trail = [];                // [{x, y, time, phase}]
  let lastTrailX = null, lastTrailY = null;

  function setActiveLayer(layer) {
    activeLayer = layer;
    if (hero) hero.classList.toggle("layer3-active", layer === layer3);
  }

  function pickRandom(exclude) {
    const pool = exclude ? revealLayers.filter(l => l !== exclude) : revealLayers;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Smooth liquid blob via Catmull-Rom → cubic bezier spline
  function makeLiquidSubpath(cx, cy, r, t, phase) {
    if (r < 1) return '';
    const pts = 10;
    const points = [];
    for (let i = 0; i < pts; i++) {
      const a = (i / pts) * Math.PI * 2;
      const distort =
        Math.sin(a * 2 + t * 0.6 + phase)       * 0.12 +
        Math.sin(a * 3 + t * 0.4 + phase * 1.3) * 0.06;
      const rr = r * (1 + distort);
      points.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    const n = points.length;
    const segs = [];
    for (let i = 0; i < n; i++) {
      const p0 = points[(i - 1 + n) % n];
      const p1 = points[i];
      const p2 = points[(i + 1) % n];
      const p3 = points[(i + 2) % n];
      if (i === 0) segs.push(`M${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`);
      const cp1x = (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1);
      const cp1y = (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1);
      const cp2x = (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1);
      const cp2y = (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1);
      segs.push(`C${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`);
    }
    return segs.join(' ') + ' Z';
  }

  function animate() {
    const now = performance.now();
    const t   = now / 1000;

    blobX += (mouseX - blobX) * 0.13;
    blobY += (mouseY - blobY) * 0.13;
    currentRadius += (targetRadius - currentRadius) * 0.10;

    trail = trail.filter(p => now - p.time < TRAIL_DURATION);

    if (activeLayer) {
      const paths = [];

      trail.forEach(p => {
        const age = (now - p.time) / TRAIL_DURATION;  // 0=newest → 1=oldest
        const r   = currentRadius * (1 - age) * 0.85;
        const sp  = makeLiquidSubpath(p.x, p.y, r, t, p.phase);
        if (sp) paths.push(sp);
      });

      const mainSp = makeLiquidSubpath(blobX, blobY, currentRadius, t, 0);
      if (mainSp) paths.push(mainSp);

      const combined = paths.length
        ? `path('${paths.join(' ')}')`
        : 'polygon(0% 0%, 0% 0%, 0% 0%)';

      revealLayers.forEach(l => {
        l.style.clipPath = l === activeLayer ? combined : 'polygon(0% 0%, 0% 0%, 0% 0%)';
      });
    }

    const stillMoving = Math.abs(targetRadius - currentRadius) > 0.5 || trail.length > 0;
    if (isActive || stillMoving) {
      rafId = requestAnimationFrame(animate);
    } else {
      revealLayers.forEach(l => { l.style.clipPath = 'polygon(0% 0%, 0% 0%, 0% 0%)'; });
      rafId = null;
    }
  }

  function startLoop() {
    if (!rafId) rafId = requestAnimationFrame(animate);
  }

  canvas.addEventListener("mouseenter", () => {
    ring.style.display = "block";
    isActive = true;
    targetRadius = RADIUS;
    blobX = mouseX; blobY = mouseY;
    trail = []; lastTrailX = null; lastTrailY = null;
    setActiveLayer(pickRandom(null));
    startLoop();
  });

  canvas.addEventListener("mouseleave", () => {
    ring.style.display = "none";
    isActive = false;
    targetRadius = 0;
    setActiveLayer(null);
    if (hero) hero.classList.remove("portfolio-text-hover");
    startLoop();
  });

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    ring.style.left = mouseX + "px";
    ring.style.top  = mouseY + "px";

    if (lastTrailX === null || Math.hypot(mouseX - lastTrailX, mouseY - lastTrailY) > TRAIL_SPACING) {
      trail.push({ x: mouseX, y: mouseY, time: performance.now(), phase: Math.random() * Math.PI * 2 });
      lastTrailX = mouseX; lastTrailY = mouseY;
    }

    if (hero && hero.classList.contains("layer3-active")) {
      const centerY = rect.height / 2;
      const inTextZone = mouseY >= centerY - 240 && mouseY <= centerY + 240;
      hero.classList.toggle("portfolio-text-hover", inTextZone);
    }
  });

  canvas.addEventListener("click", () => {
    if (activeLayer) setActiveLayer(pickRandom(activeLayer));
  });
})();

// ======================== DATE FORMATTER ========================
function formatToday() {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, "0");
  const month = now.toLocaleString("en-US", { month: "short" });
  const year = now.getFullYear();
  return `${day} ${month}, ${year}`;
}

// typewriter effect
function typeWriter(text, element, speed = 50, onDone) {
  let i = 0;
  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    } else if (onDone) {
      onDone();
    }
  }
  type();
}

// ======================== DOM READY ========================
document.addEventListener("DOMContentLoaded", () => {

  // --- 1. Date in header ---
  const dateEl = document.getElementById("current-date");
  if (dateEl) {
    const formatted = formatToday();
    dateEl.textContent = "";
    typeWriter(formatted, dateEl, 40);
  }

  // --- 1b. Mentoring stat count-up ---
  const statEl = document.querySelector(".mentor-stat");
  if (statEl) {
    const target = parseInt(statEl.dataset.target, 10);
    const countObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const startTime = performance.now();
        const duration  = 1600;
        function tick(now) {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased    = 1 - Math.pow(1 - progress, 3);
          statEl.textContent = Math.floor(eased * target);
          if (progress < 1) requestAnimationFrame(tick);
          else statEl.textContent = target;
        }
        requestAnimationFrame(tick);
        countObserver.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    countObserver.observe(statEl);
  }

  // --- 2. Scroll reveal animations (hero, about sections) ---
  const revealEls = document.querySelectorAll(".reveal, .reveal-left, .reveal-right");

  if (revealEls.length > 0) {
    const revealObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    revealEls.forEach(el => revealObserver.observe(el));
  }

  // --- 3. Parallax elements ---
  const parallaxEls = document.querySelectorAll(".parallax");

  if (parallaxEls.length > 0) {
    const handleParallax = () => {
      parallaxEls.forEach(el => {
        const speed = parseFloat(el.dataset.speed) || 0.15;
        const rect = el.getBoundingClientRect();
        const offset = rect.top - window.innerHeight / 2;
        const translate = -offset * speed;

        el.style.setProperty("--parallax-offset", `${translate}px`);
      });
    };

    handleParallax();
    window.addEventListener("scroll", handleParallax);
    window.addEventListener("resize", handleParallax);
  }

  // --- 4. PROJECT DOMAIN TRANSITION (gradient + reversible) ---
  const domainSection = document.querySelector(".project-domain-transition");

  if (domainSection) {
    const domainObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Enter viewport → fade in, scale up
            domainSection.classList.add("visible");
          } else {
            // Leave viewport (scroll up or down) → fade out, scale down
            domainSection.classList.remove("visible");
          }
        });
      },
      { threshold: 0.3 } // tweak how "deep" into view before it triggers
    );

    domainObserver.observe(domainSection);
  }

});

// --- DOMAIN SCENE (smooth: all same -> finance centers -> finance zoom -> IDP -> finance disappears) ---
const scrollContainer = document.querySelector(".page-content") || window;

const scene   = document.getElementById("domainScene");
const words   = document.getElementById("wordsGroup");
const finance = document.getElementById("wFinance");
const health  = document.getElementById("wHealth");
const adtech  = document.getElementById("wSchain");
const idp     = document.getElementById("idpLayer");

if (scene && words && finance && health && adtech && idp) {
  const getScrollTop = () =>
    scrollContainer === window
      ? (document.documentElement.scrollTop || document.body.scrollTop)
      : scrollContainer.scrollTop;

  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  // Stable centering calc (NOT affected by transforms)
  const computeCenterShift = () => {
    const groupCenter = words.clientWidth / 2;
    const finCenter = finance.offsetLeft + finance.offsetWidth / 2;
    return groupCenter - finCenter; // px
  };

  let targetShift = 0;

  const handle = () => {
    const vh = scrollContainer === window ? window.innerHeight : scrollContainer.clientHeight;
    const sectionTop = scene.offsetTop;
    const st = getScrollTop();

    const total = Math.max(1, scene.offsetHeight - vh);
    const passed = Math.min(Math.max(st - sectionTop, 0), total);
    const p = passed / total; // 0..1

    // measure centering continuously (and on resize) — smooth result
    targetShift = computeCenterShift();

    /*
      Smooth timeline (no dead zone, no snap):
      0.00 - 0.30 : finance moves to center + others fade out
      0.30 - 0.60 : finance zooms to core
      0.60 - 0.80 : IDP appears behind
      0.80 - 1.00 : finance zooms more + disappears, IDP takes over
    */
    const t1 = clamp01(p / 0.30);
    const t2 = clamp01((p - 0.30) / (0.60 - 0.30));
    const t3 = clamp01((p - 0.60) / (0.80 - 0.60));
    const t4 = clamp01((p - 0.80) / (1.00 - 0.80));

    // ---- Center FINANCE smoothly (same element) ----
    const shiftX = lerp(0, targetShift, t1);
    words.style.transform = `translateX(${shiftX}px)`;

    // ---- Fade others smoothly to 0 (disappear) ----
    health.style.opacity = `${lerp(1, 0, t1)}`;
    adtech.style.opacity = `${lerp(1, 0, t1)}`;

    // ---- Finance smooth scale: 1 -> 1.15 during centering ----
    const s1 = lerp(1, 1.15, t1);

    // ---- Then zoom: 1.15 -> 4.2 ----
    const s2 = lerp(1.15, 4.2, t2);

    // Blend scales smoothly (no jump)
    const financeScale = (t2 > 0) ? s2 : s1;
    finance.style.transform = `scale(${financeScale})`;
    finance.style.transformOrigin = "center center";
    finance.style.opacity = "1";

    // ---- IDP appears behind ----
    idp.style.opacity = `${lerp(0, 1, t3)}`;
    idp.style.transform = `translateY(${lerp(40, 0, t3)}px)`;

    // Slightly dim finance as IDP becomes readable
    finance.style.opacity = `${lerp(1, 0.65, t3)}`;

    // ---- Final: finance zooms + disappears, IDP becomes main ----
    const finFinalScale = lerp(4.2, 10, t4);
    finance.style.transform = `scale(${finFinalScale})`;
    finance.style.opacity = `${lerp(0.65, 0, t4)}`;

    words.style.opacity = `${lerp(1, 0, t4)}`;

    if (t4 > 0) {
      idp.style.opacity = "1";
      idp.style.transform = "translateY(0)";
    }
  };

  handle();
  scrollContainer.addEventListener("scroll", handle);
  window.addEventListener("resize", handle);
}
// ================= FINANCE PROJECTS HORIZONTAL SCROLL =================
// Starts AFTER domain-scene finishes (no duplication of IDP)

(() => {
  const scrollContainer = document.querySelector(".page-content") || window;
  const hSection = document.getElementById("financeHscroll");
  const track = document.getElementById("financeTrack");

  if (!hSection || !track) return;

  const getScrollTop = () =>
    scrollContainer === window
      ? (document.documentElement.scrollTop || document.body.scrollTop)
      : scrollContainer.scrollTop;

  const clamp01 = v => Math.min(1, Math.max(0, v));

  const handle = () => {
    const vh = scrollContainer === window
      ? window.innerHeight
      : scrollContainer.clientHeight;

    const sectionTop = hSection.offsetTop;
    const scrollTop = getScrollTop();

    const total = Math.max(1, hSection.offsetHeight - vh);
    const passed = clamp01((scrollTop - sectionTop) / total);

    // 4 project slides → move 0 → -300vw
    track.style.transform = `translateX(${-300 * passed}vw)`;
  };

  handle();
  scrollContainer.addEventListener("scroll", handle);
  window.addEventListener("resize", handle);
})();

// ================= HEALTH DOMAIN SCENE =================
{
  const sc      = document.querySelector(".page-content") || window;
  const hScene  = document.getElementById("healthScene");
  const hWords  = document.getElementById("healthWordsGroup");
  const hCare   = document.getElementById("hsCare");
  const hMain   = document.getElementById("hsHealth");
  const hVision = document.getElementById("hsSupply");
  const hLayer  = document.getElementById("healthLayer");

  if (hScene && hWords && hCare && hMain && hVision && hLayer) {
    const getST   = () => sc === window ? (document.documentElement.scrollTop || document.body.scrollTop) : sc.scrollTop;
    const c01     = v  => Math.min(1, Math.max(0, v));
    const lrp     = (a, b, t) => a + (b - a) * t;
    const midShift = () => {
      const gc = hWords.clientWidth / 2;
      const mc = hMain.offsetLeft + hMain.offsetWidth / 2;
      return gc - mc;
    };

    const tick = () => {
      const vh  = sc === window ? window.innerHeight : sc.clientHeight;
      const top = hScene.offsetTop;
      const st  = getST();
      const p   = Math.min(Math.max(st - top, 0), Math.max(1, hScene.offsetHeight - vh)) / Math.max(1, hScene.offsetHeight - vh);

      const t1 = c01(p / 0.30);
      const t2 = c01((p - 0.30) / 0.30);
      const t3 = c01((p - 0.60) / 0.20);
      const t4 = c01((p - 0.80) / 0.20);

      hWords.style.transform = `translateX(${lrp(0, midShift(), t1)}px)`;
      hCare.style.opacity    = `${lrp(1, 0, t1)}`;
      hVision.style.opacity  = `${lrp(1, 0, t1)}`;

      const scale = t2 > 0 ? lrp(1.15, 4.2, t2) : lrp(1, 1.15, t1);
      hMain.style.transform       = `scale(${scale})`;
      hMain.style.transformOrigin = "center center";
      hMain.style.opacity         = "1";

      hLayer.style.opacity   = `${lrp(0, 1, t3)}`;
      hLayer.style.transform = `translateY(${lrp(40, 0, t3)}px)`;
      hMain.style.opacity    = `${lrp(1, 0.65, t3)}`;

      hMain.style.transform  = `scale(${lrp(4.2, 10, t4)})`;
      hMain.style.opacity    = `${lrp(0.65, 0, t4)}`;
      hWords.style.opacity   = `${lrp(1, 0, t4)}`;

      if (t4 > 0) {
        hLayer.style.opacity   = "1";
        hLayer.style.transform = "translateY(0)";
      }
    };

    tick();
    sc.addEventListener("scroll", tick);
    window.addEventListener("resize", tick);
  }
}

// ================= HEALTH PROJECTS HORIZONTAL SCROLL =================
(() => {
  const sc      = document.querySelector(".page-content") || window;
  const hSect   = document.getElementById("healthHscroll");
  const hTrack  = document.getElementById("healthTrack");

  if (!hSect || !hTrack) return;

  const getST  = () => sc === window ? (document.documentElement.scrollTop || document.body.scrollTop) : sc.scrollTop;
  const c01    = v => Math.min(1, Math.max(0, v));

  const tick = () => {
    const vh    = sc === window ? window.innerHeight : sc.clientHeight;
    const total = Math.max(1, hSect.offsetHeight - vh);
    const passed = c01((getST() - hSect.offsetTop) / total);
    // 6 slides → move 0 → -500vw
    hTrack.style.transform = `translateX(${-500 * passed}vw)`;
  };

  tick();
  sc.addEventListener("scroll", tick);
  window.addEventListener("resize", tick);
})();

// ================= SUPPLY CHAIN DOMAIN SCENE =================
{
  const sc     = document.querySelector(".page-content") || window;
  const sScene = document.getElementById("schainScene");
  const sWords = document.getElementById("schainWordsGroup");
  const sA     = document.getElementById("scSupply");
  const sMain  = document.getElementById("scChain");
  const sB     = document.getElementById("scMgmt");
  const sLayer = document.getElementById("schainLayer");

  if (sScene && sWords && sA && sMain && sB && sLayer) {
    const getST  = () => sc === window ? (document.documentElement.scrollTop || document.body.scrollTop) : sc.scrollTop;
    const c01    = v => Math.min(1, Math.max(0, v));
    const lrp    = (a, b, t) => a + (b - a) * t;
    const midShift = () => {
      const gc = sWords.clientWidth / 2;
      const mc = sMain.offsetLeft + sMain.offsetWidth / 2;
      return gc - mc;
    };

    const tick = () => {
      const vh  = sc === window ? window.innerHeight : sc.clientHeight;
      const top = sScene.offsetTop;
      const st  = getST();
      const p   = Math.min(Math.max(st - top, 0), Math.max(1, sScene.offsetHeight - vh)) / Math.max(1, sScene.offsetHeight - vh);

      const t1 = c01(p / 0.30);
      const t2 = c01((p - 0.30) / 0.30);
      const t3 = c01((p - 0.60) / 0.20);
      const t4 = c01((p - 0.80) / 0.20);

      sWords.style.transform = `translateX(${lrp(0, midShift(), t1)}px)`;
      sA.style.opacity       = `${lrp(1, 0, t1)}`;
      sB.style.opacity       = `${lrp(1, 0, t1)}`;

      const scale = t2 > 0 ? lrp(1.15, 4.2, t2) : lrp(1, 1.15, t1);
      sMain.style.transform       = `scale(${scale})`;
      sMain.style.transformOrigin = "center center";
      sMain.style.opacity         = "1";

      sLayer.style.opacity   = `${lrp(0, 1, t3)}`;
      sLayer.style.transform = `translateY(${lrp(40, 0, t3)}px)`;
      sMain.style.opacity    = `${lrp(1, 0.65, t3)}`;

      sMain.style.transform  = `scale(${lrp(4.2, 10, t4)})`;
      sMain.style.opacity    = `${lrp(0.65, 0, t4)}`;
      sWords.style.opacity   = `${lrp(1, 0, t4)}`;

      if (t4 > 0) {
        sLayer.style.opacity   = "1";
        sLayer.style.transform = "translateY(0)";
      }
    };

    tick();
    sc.addEventListener("scroll", tick);
    window.addEventListener("resize", tick);
  }
}

// ================= SUPPLY CHAIN HORIZONTAL SCROLL (1 project) =================
(() => {
  const sc     = document.querySelector(".page-content") || window;
  const sSect  = document.getElementById("schainHscroll");
  const sTrack = document.getElementById("schainTrack");

  if (!sSect || !sTrack) return;

  const getST = () => sc === window ? (document.documentElement.scrollTop || document.body.scrollTop) : sc.scrollTop;
  const c01   = v => Math.min(1, Math.max(0, v));

  const tick = () => {
    const vh    = sc === window ? window.innerHeight : sc.clientHeight;
    const total = Math.max(1, sSect.offsetHeight - vh);
    const passed = c01((getST() - sSect.offsetTop) / total);
    // 1 slide — no horizontal movement, just a sticky reveal
    sTrack.style.transform = `translateX(0)`;
  };

  tick();
  sc.addEventListener("scroll", tick);
  window.addEventListener("resize", tick);
})();

// ================= RESEARCH DOMAIN SCENE =================
{
  const sc     = document.querySelector(".page-content") || window;
  const rScene = document.getElementById("resScene");
  const rWords = document.getElementById("resWordsGroup");
  const rA     = document.getElementById("resData");
  const rMain  = document.getElementById("resMain");
  const rB     = document.getElementById("resPaper");
  const rLayer = document.getElementById("resLayer");

  if (rScene && rWords && rA && rMain && rB && rLayer) {
    const getST  = () => sc === window ? (document.documentElement.scrollTop || document.body.scrollTop) : sc.scrollTop;
    const c01    = v => Math.min(1, Math.max(0, v));
    const lrp    = (a, b, t) => a + (b - a) * t;
    const midShift = () => {
      const gc = rWords.clientWidth / 2;
      const mc = rMain.offsetLeft + rMain.offsetWidth / 2;
      return gc - mc;
    };

    const tick = () => {
      const vh  = sc === window ? window.innerHeight : sc.clientHeight;
      const top = rScene.offsetTop;
      const st  = getST();
      const p   = Math.min(Math.max(st - top, 0), Math.max(1, rScene.offsetHeight - vh)) / Math.max(1, rScene.offsetHeight - vh);

      const t1 = c01(p / 0.30);
      const t2 = c01((p - 0.30) / 0.30);
      const t3 = c01((p - 0.60) / 0.20);
      const t4 = c01((p - 0.80) / 0.20);

      rWords.style.transform = `translateX(${lrp(0, midShift(), t1)}px)`;
      rA.style.opacity       = `${lrp(1, 0, t1)}`;
      rB.style.opacity       = `${lrp(1, 0, t1)}`;

      const scale = t2 > 0 ? lrp(1.15, 4.2, t2) : lrp(1, 1.15, t1);
      rMain.style.transform       = `scale(${scale})`;
      rMain.style.transformOrigin = "center center";
      rMain.style.opacity         = "1";

      rLayer.style.opacity   = `${lrp(0, 1, t3)}`;
      rLayer.style.transform = `translateY(${lrp(40, 0, t3)}px)`;
      rMain.style.opacity    = `${lrp(1, 0.65, t3)}`;

      rMain.style.transform  = `scale(${lrp(4.2, 10, t4)})`;
      rMain.style.opacity    = `${lrp(0.65, 0, t4)}`;
      rWords.style.opacity   = `${lrp(1, 0, t4)}`;

      if (t4 > 0) {
        rLayer.style.opacity   = "1";
        rLayer.style.transform = "translateY(0)";
      }
    };

    tick();
    sc.addEventListener("scroll", tick);
    window.addEventListener("resize", tick);
  }
}

// ================= RESEARCH HORIZONTAL SCROLL (1 project) =================
(() => {
  const rSect  = document.getElementById("resHscroll");
  const rTrack = document.getElementById("resTrack");
  if (!rSect || !rTrack) return;
  // Single slide — no horizontal movement needed
  rTrack.style.transform = "translateX(0)";
})();

// ================= CLOSING STATEMENT TYPING EFFECT =================
(() => {
  const line1 = document.getElementById("closingLine1");
  const line2 = document.getElementById("closingLine2");
  if (!line1 || !line2) return;

  const text1 = "I have done many projects and explored many domains, but these are some of my significant ones, that got me recognised by the world and the AWS community.";
  const text2 = "More coming soon...";

  let triggered = false;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !triggered) {
        triggered = true;
        observer.disconnect();
        typeWriter(text1, line1, 28, () => {
          setTimeout(() => typeWriter(text2, line2, 60), 400);
        });
      }
    });
  }, { threshold: 0.4 });

  observer.observe(document.getElementById("projectsClosing"));
})();

// ======================== MOBILE NAV TOGGLE ========================
(function () {
  const toggle = document.getElementById("nav-toggle");
  const nav    = document.getElementById("top-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("nav-open");
    toggle.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", open);
  });

  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("nav-open");
      toggle.classList.remove("nav-open");
    });
  });
})();
