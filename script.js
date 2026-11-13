(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---------- menu ----------
  const menu = $("#menu"), menuBtn = $("#menuBtn");
  function setMenu(open) {
    menu.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", open);
    $("span", menuBtn).textContent = open ? "Close" : "Menu";
    document.body.style.overflow = open ? "hidden" : "";
  }
  menuBtn.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
  $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

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

  // ---------- motion ----------
  const reduceOS = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let motion = !reduceOS;
  try { const s = localStorage.getItem("motion"); if (s !== null) motion = s === "on"; } catch (e) {}
  const toggle = $("#motionToggle"), state = $("#motionState");
  const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";

  function showStaticCounts() { $$("[data-count]").forEach((n) => { n.textContent = n.dataset.count + (n.dataset.suffix || ""); }); }

  function applyMotion() {
    document.body.classList.toggle("no-motion", !motion);
    toggle.setAttribute("aria-pressed", motion);
    state.textContent = motion ? "on" : "off";
    if (!hasGsap) { showStaticCounts(); return; }
    if (!motion) { ScrollTrigger.getAll().forEach((t) => t.kill()); gsap.killTweensOf("*"); gsap.set(".rv, .portrait", { clearProps: "all" }); showStaticCounts(); }
  }

  toggle.addEventListener("click", () => {
    motion = !motion;
    try { localStorage.setItem("motion", motion ? "on" : "off"); } catch (e) {}
    if (motion) location.reload(); else applyMotion();
  });

  // reveal targets
  $$(".proof-row > div, .about-grid > *, .perspectives, .case, .more a, .expertise, .impact-big, .impact-side > div, .thread-text, .tl, .links li, #enquiry-form, h2, .sub")
    .forEach((el) => el.classList.add("rv"));

  if (!motion || !hasGsap) { applyMotion(); return; }
  applyMotion();
  gsap.registerPlugin(ScrollTrigger);

  // hero intro
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.from(".portrait", { opacity: 0, scale: 1.06, duration: 1.6 })
    .from(".hero h1", { y: 60, opacity: 0, duration: 1.1 }, "-=1.1")
    .from(".hero .lead, .hero .cta, .hero .mono", { y: 20, opacity: 0, duration: .9, stagger: .08 }, "-=.7");
  gsap.to(".portrait", { yPercent: 12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  // reveals
  $$(".rv").forEach((el) => {
    gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
  });

  // counters
  $$("[data-count]").forEach((n) => {
    const end = +n.dataset.count, suffix = n.dataset.suffix || "", o = { v: 0 };
    gsap.to(o, { v: end, duration: 1.8, ease: "power2.out", scrollTrigger: { trigger: n, start: "top 90%", once: true },
      onUpdate: () => { n.textContent = Math.round(o.v) + suffix; } });
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
