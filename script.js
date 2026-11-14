(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";

  // ---------- portrait mode: photo (default) or dots (?portrait=dots) ----------
  let pmode = "photo";
  try { if (new URLSearchParams(location.search).get("portrait") === "dots") pmode = "dots"; } catch (e) {}
  document.body.dataset.portrait = pmode;

  // ---------- motion preference (follows the visitor's system setting) ----------
  const reduceOS = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let motion = !reduceOS;
  if (!hasGsap) motion = false;
  document.body.classList.toggle("no-motion", !motion);

  // ---------- navbar offset: sections align just below the floating navbar ----------
  const navEl = $(".navigation");
  const navBottom = () => 14 + navEl.offsetHeight + 6;
  const setNavVar = () => document.documentElement.style.setProperty("--nav-bottom", navBottom() + "px");
  setNavVar();
  window.addEventListener("resize", setNavVar);

  // ---------- smooth scroll (Lenis) ----------
  let lenis = null;
  if (motion && typeof Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    gsap.registerPlugin(ScrollTrigger);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  } else if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
  }

  // ---------- menu ----------
  const menu = $("#menu"), menuBtn = $("#menuBtn");
  function setMenu(open) {
    menu.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", open);
    $("span", menuBtn).textContent = open ? "Close" : "Menu";
    if (lenis) { open ? lenis.stop() : lenis.start(); } else { document.body.style.overflow = open ? "hidden" : ""; }
  }
  menuBtn.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  // anchor links (smooth via Lenis when available)
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    const target = id.length > 1 ? $(id) : null;
    if (!target) return;
    if (a.closest("#menu")) setMenu(false);
    if (lenis) { e.preventDefault(); lenis.scrollTo(target, { offset: -navBottom(), duration: 1.4 }); }
  }));

  // ---------- tabs ----------
  $$("[data-tabs]").forEach((group) => {
    const btns = $$("[data-tab]", group), panels = $$("[data-panel]", group);
    btns.forEach((b) => b.addEventListener("click", () => {
      btns.forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-selected", x === b); });
      panels.forEach((p) => p.classList.toggle("on", p.dataset.panel === b.dataset.tab));
    }));
  });

  // ---------- contact form ----------
  (function () {
    const form = $("#enquiry-form"), status = $("#form-status"), button = $("button[type=submit]", form);
    if (typeof emailjs === "undefined") return;
    // EmailJS public key (safe to expose; restrict allowed domains in the EmailJS dashboard)
    emailjs.init("gDOm08i95Bwjfs1s_");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      button.disabled = true;
      status.textContent = "Sending...";
      emailjs.sendForm("service_ogydzk3", "template_5ylpwlc", form)
        .then(() => { status.textContent = "Message sent successfully!"; form.reset(); })
        .catch((err) => { status.textContent = "Failed to send message. Try again!"; console.error("Error:", err); })
        .finally(() => { button.disabled = false; });
    });
  })();

  function showStaticCounts() { $$("[data-count]").forEach((n) => { n.textContent = n.dataset.count + (n.dataset.suffix || ""); }); }

  // ---------- particle portrait (hero) ----------
  let scrollP = 0; // 0..1 over the hero
  function initPortrait() {
    const wrap = $(".portrait"), img = $("img", wrap), canvas = $("#portraitCanvas"), ctx = canvas.getContext("2d");
    const src = new Image();
    let parts = [], W = 0, H = 0, dpr = 1, mouse = { x: -999, y: -999 }, running = true, assembled = false;

    function build() {
      const rect = wrap.getBoundingClientRect();
      if (!rect.width) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width; H = rect.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      const step = W < 420 ? 4 : 5;
      const cols = Math.floor(W / step), rows = Math.floor(H / step);
      const off = document.createElement("canvas"); off.width = cols; off.height = rows;
      const o = off.getContext("2d", { willReadFrequently: true });
      o.drawImage(src, 0, 0, cols, rows);
      let data;
      try { data = o.getImageData(0, 0, cols, rows).data; } catch (e) { return false; }
      parts = [];
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4, a = data[i + 3];
        if (a < 128) continue;
        const lum = data[i] / 255;
        const r = (step / 2) * Math.sqrt(lum) * 1.1;
        if (r < 0.45) continue;
        const hx = (x + 0.5) * step, hy = (y + 0.5) * step;
        parts.push({ hx, hy, x: assembled ? hx : Math.random() * W, y: assembled ? hy : H + Math.random() * H * 0.6, vx: 0, vy: 0, r, rx: Math.random() - 0.5, ry: Math.random() });
      }
      return true;
    }

    function frame() {
      if (!running) return;
      requestAnimationFrame(frame);
      if (scrollP >= 1) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#f1eee8";
      ctx.globalAlpha = Math.max(0, 1 - scrollP * 1.15);
      ctx.beginPath();
      const p = scrollP, mr = 80, mr2 = mr * mr;
      for (let i = 0; i < parts.length; i++) {
        const q = parts[i];
        const tx = q.hx + q.rx * p * 340, ty = q.hy - (0.25 + q.ry) * p * 360;
        q.vx += (tx - q.x) * 0.045; q.vy += (ty - q.y) * 0.045;
        const dx = q.x - mouse.x, dy = q.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < mr2) { const f = (1 - d2 / mr2) * 2.2, d = Math.sqrt(d2) || 1; q.vx += (dx / d) * f; q.vy += (dy / d) * f; }
        q.vx *= 0.84; q.vy *= 0.84;
        q.x += q.vx; q.y += q.vy;
        ctx.moveTo(q.x + q.r, q.y);
        ctx.arc(q.x, q.y, q.r, 0, 6.2832);
      }
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    src.onload = () => {
      if (build() === false) return; // canvas tainted (e.g. file://) -> keep static image
      wrap.classList.add("live");
      requestAnimationFrame(frame);
      setTimeout(() => { assembled = true; }, 2500);
    };
    src.src = "images/portrait.webp";

    window.addEventListener("mousemove", (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    }, { passive: true });
    window.addEventListener("mouseleave", () => { mouse.x = mouse.y = -999; });
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { assembled = true; build(); }, 250); });
  }

  // ---------- photo portrait: mouse parallax + names slide apart on scroll ----------
  function initPhotoPortrait() {
    if (!window.matchMedia("(hover: hover)").matches) return;
    const photo = $(".photo-img"), n1 = $(".hero h1 .n1"), n2 = $(".hero h1 .n2");
    const px = gsap.quickTo(photo, "x", { duration: 1.2, ease: "power3" }), py = gsap.quickTo(photo, "y", { duration: 1.2, ease: "power3" });
    const ax = gsap.quickTo(n1, "x", { duration: 1.4, ease: "power3" }), bx = gsap.quickTo(n2, "x", { duration: 1.4, ease: "power3" });
    window.addEventListener("mousemove", (e) => {
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      px(nx * -18); py(ny * -10); ax(nx * 26); bx(nx * 26);
    }, { passive: true });
  }

  // ct-card hover glow follows the pointer
  $$(".ct-card").forEach((c) => c.addEventListener("pointermove", (e) => {
    const r = c.getBoundingClientRect(); c.style.setProperty("--mx", (e.clientX - r.left) + "px"); c.style.setProperty("--my", (e.clientY - r.top) + "px");
  }));

  // ---------- reveal targets ----------
  $$(".proof-row > div, .about-grid > *, .perspectives, .case, .more a, .fl-card, .fl-note > div, .expertise, .impact-big, .impact-side > div, .tl, .edu-card, .ct-card, #enquiry-form, h2, .sub")
    .forEach((el) => el.classList.add("rv"));

  if (!motion) { showStaticCounts(); $$(".rv").forEach((e) => e.classList.remove("rv")); return; }

  const sections = $$("main > section");

  // ---------- section exit effect: each section settles back as the next one slides up ----------
  sections.forEach((s, i) => {
    if (i === sections.length - 1) return;
    gsap.fromTo(s, { scale: 1, opacity: 1, borderRadius: 0, transformOrigin: "50% 100%" }, {
      scale: 0.9, opacity: 0.12, borderRadius: 36, ease: "none", immediateRender: false,
      scrollTrigger: { trigger: s, start: () => "bottom " + Math.round(innerHeight * 0.75), end: () => "bottom top+=" + navBottom(), scrub: true, invalidateOnRefresh: true }
    });
  });

  // faded hero logo: drifts up as you scroll away, and leans toward the mouse
  // desktop/laptop: the logo stays completely static; tablets and phones keep the drifting version
  const staticLogo = window.matchMedia("(min-width: 961px) and (min-height: 561px)").matches;
  if (!staticLogo) gsap.to(".hero > .bg-logo", { yPercent: -25, opacity: 0, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  if (!staticLogo && window.matchMedia("(hover: hover)").matches) {
    const lx = gsap.quickTo(".hero > .bg-logo", "x", { duration: 1.6, ease: "power3" }), ly = gsap.quickTo(".hero > .bg-logo", "y", { duration: 1.6, ease: "power3" });
    window.addEventListener("mousemove", (e) => { lx((e.clientX / innerWidth - 0.5) * -40); ly((e.clientY / innerHeight - 0.5) * -28); }, { passive: true });
  }

  // ---------- scroll progress ----------
  gsap.to(".progress span", { scaleX: 1, ease: "none", scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.2 } });

  // ---------- hero scroll: particles disperse, content drifts ----------
  ScrollTrigger.create({
    trigger: ".hero", start: "top top", end: "bottom 15%", scrub: true,
    onUpdate: (s) => { scrollP = s.progress; }
  });
  gsap.to(pmode === "photo" ? ".hero-sub" : ".hero-main", { yPercent: -35, opacity: 0, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "70% top", scrub: true } });
  gsap.to(".hero-top, .hero-left, .hero-bottom", { opacity: 0, ease: "none", scrollTrigger: { trigger: ".hero", start: "10% top", end: "45% top", scrub: true } });
  if (pmode === "photo") {
    gsap.to(".hero h1 .n1", { xPercent: -18, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero h1 .n2", { xPercent: 18, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  }
  gsap.to(".portrait", { yPercent: -10, scale: 1.08, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  // ---------- intro: logo splash then hero ----------
  if (pmode === "dots") initPortrait();
  else initPhotoPortrait();
  const loader = $("#loader");
  document.body.style.overflow = "hidden"; if (lenis) lenis.stop();
  const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
  gsap.set(".hero h1, .hero .lead, .hero .cta, .hero .mono, .navigation", { opacity: 0, y: 30 });
  intro.from(".loader img", { opacity: 0, scale: .85, duration: 1 })
       .to(".loader img", { opacity: 0, y: -20, duration: .5, delay: .35 })
       .to(loader, { yPercent: -100, duration: .9, ease: "power4.inOut" })
       .add(() => { document.body.style.overflow = ""; if (lenis) lenis.start(); loader.remove(); })
       .to(".navigation", { opacity: 1, y: 0, duration: .9 }, "-=.5")
       .to(".hero h1", { opacity: 1, y: 0, duration: 1.2 }, "-=.8")
       .to(".hero .lead, .hero .cta, .hero .mono", { opacity: 1, y: 0, duration: .9, stagger: .08 }, "-=.8");

  // ---------- reveals ----------
  $$(".rv").forEach((el) => {
    gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
  });

  // project images: clip reveal + parallax
  $$(".case").forEach((c) => {
    const box = $(".case-img", c), img = $("img", box);
    gsap.fromTo(box, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 1.3, ease: "power4.out", scrollTrigger: { trigger: c, start: "top 80%", once: true } });
    if (img) gsap.fromTo(img, { yPercent: -7, scale: 1.12 }, { yPercent: 7, ease: "none", scrollTrigger: { trigger: c, start: "top bottom", end: "bottom top", scrub: true } });
  });

  // big numbers scale with scroll
  gsap.fromTo(".impact-big b", { scale: .75, opacity: .3 }, { scale: 1, opacity: 1, ease: "none", transformOrigin: "left center", scrollTrigger: { trigger: ".impact", start: "top 80%", end: "top 25%", scrub: true } });
  gsap.fromTo(".impact", { backgroundPosition: "0% 0%" }, { backgroundPosition: "0% 40%", ease: "none", scrollTrigger: { trigger: ".impact", start: "top bottom", end: "bottom top", scrub: true } });

  // "thread" lines: words light up as you scroll
  const thread = $(".thread-text");
  if (thread) {
    (function split(node) {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((w) => {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
            const s = document.createElement("span"); s.className = "tw"; s.textContent = w; frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== "BR") split(n);
      });
    })(thread);
    gsap.to(".tw", { opacity: 1, stagger: .12, ease: "none", scrollTrigger: { trigger: thread, start: "top 80%", end: "bottom 45%", scrub: true } });
  }

  // timeline rows slide in with their line
  $$(".tl").forEach((row) => {
    gsap.from($(".yr", row), { x: -30, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: row, start: "top 85%" } });
  });

  // education timeline: the line draws as you scroll down it
  gsap.fromTo(".edu-line span", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".edu-list", start: "top 70%", end: "bottom 60%", scrub: true } });
  $$(".edu-node").forEach((n) => gsap.from(n, { scale: 0, duration: .6, ease: "back.out(2)", scrollTrigger: { trigger: n, start: "top 85%" } }));

  // counters
  $$("[data-count]").forEach((n) => {
    const end = +n.dataset.count, suffix = n.dataset.suffix || "", o = { v: 0 };
    gsap.to(o, { v: end, duration: 1.8, ease: "power2.out", scrollTrigger: { trigger: n, start: "top 90%", once: true },
      onUpdate: () => { n.textContent = Math.round(o.v) + suffix; } });
  });

  // menu logo gentle float
  gsap.to(".menu-logo", { y: -14, duration: 3, ease: "sine.inOut", repeat: -1, yoyo: true });

  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
