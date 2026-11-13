(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  const loader = document.getElementById("loader");
  const count = document.getElementById("count");

  // ---------- helpers ----------
  function splitWords(el) {
    const text = el.textContent.trim().replace(/\s+/g, " ");
    el.setAttribute("aria-label", text);
    el.innerHTML = text
      .split(" ")
      .map((w) => '<span class="w" aria-hidden="true"><span>' + w + "</span></span>")
      .join(" ");
  }

  function splitChars(el) {
    const text = el.textContent;
    el.innerHTML = [...text].map((c) => '<span class="ch">' + c + "</span>").join("");
  }

  document.querySelectorAll(".split-words").forEach(splitWords);
  document.querySelectorAll(".title .chars").forEach(splitChars);

  // ---------- contact form ----------
  function setupContactForm() {
    const form = document.getElementById("enquiry-form");
    const status = document.getElementById("form-status");
    const button = form.querySelector("button[type=submit]");
    if (typeof emailjs === "undefined") return;

    // EmailJS public key (safe to expose; restrict allowed domains in the EmailJS dashboard)
    emailjs.init("gDOm08i95Bwjfs1s_");

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      button.disabled = true;
      status.textContent = "Sending...";
      emailjs
        .sendForm("service_ogydzk3", "template_5ylpwlc", form)
        .then(() => {
          status.textContent = "Message sent successfully!";
          form.reset();
        })
        .catch((err) => {
          status.textContent = "Failed to send message. Try again!";
          console.error("Error:", err);
        })
        .finally(() => { button.disabled = false; });
    });
  }
  setupContactForm();

  // ---------- no-animation fallback ----------
  if (!hasGsap || reduce) {
    loader.remove();
    document.querySelectorAll("[data-count]").forEach((n) => { n.textContent = n.dataset.count; });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // ---------- custom cursor ----------
  const cursor = document.querySelector(".cursor");
  if (window.matchMedia("(hover: hover)").matches) {
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3" });
    window.addEventListener("mousemove", (e) => {
      cursor.style.opacity = 1;
      xTo(e.clientX);
      yTo(e.clientY);
    });
    document.querySelectorAll("a, button").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("big"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("big"));
    });
  }

  // ---------- scroll progress ----------
  gsap.to(".progress span", {
    scaleX: 1, ease: "none",
    scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.3 }
  });

  // ---------- initial states ----------
  gsap.set(".title .ch", { yPercent: 110 });
  gsap.set(".reveal-up", { y: 30, opacity: 0 });
  gsap.set(".bar-top", { yPercent: -100 });
  gsap.set(".bar-bottom", { yPercent: 100 });
  document.body.style.overflow = "hidden";

  // ---------- intro timeline ----------
  function playIntro() {
    document.body.style.overflow = "";
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.to(loader, { yPercent: -100, duration: 1.1, ease: "power4.inOut" })
      .to([".bar-top", ".bar-bottom"], { yPercent: 0, duration: 1.2 }, "-=0.6")
      .to(".title .ch", { yPercent: 0, duration: 1.3, stagger: 0.05 }, "-=0.7")
      .to(".reveal-up", { y: 0, opacity: 1, duration: 1, stagger: 0.15 }, "-=0.8")
      .add(() => loader.remove());
  }

  // loader counter
  const c = { v: 0 };
  gsap.to(c, {
    v: 100, duration: 2.2, ease: "power2.inOut",
    onUpdate: () => { count.textContent = String(Math.round(c.v)).padStart(3, "0"); },
    onComplete: playIntro
  });

  // ---------- hero parallax ----------
  gsap.to(".title", { yPercent: 18, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".tagline, .scroll-cue, .hero-meta, .eyebrow", { opacity: 0, ease: "none", scrollTrigger: { trigger: "#hero", start: "20% top", end: "70% top", scrub: true } });

  // ---------- word reveals ----------
  document.querySelectorAll(".split-words").forEach((el) => {
    gsap.from(el.querySelectorAll(".w > span"), {
      yPercent: 110, duration: 1, ease: "power4.out", stagger: 0.04,
      scrollTrigger: { trigger: el, start: "top 85%" }
    });
  });

  // ---------- scene labels ----------
  gsap.utils.toArray(".scene-no").forEach((el) => {
    gsap.from(el, { opacity: 0, x: -30, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" } });
  });

  // ---------- stats counters ----------
  document.querySelectorAll("[data-count]").forEach((n) => {
    const end = +n.dataset.count;
    const o = { v: 0 };
    gsap.to(o, {
      v: end, duration: 1.8, ease: "power2.out",
      scrollTrigger: { trigger: n, start: "top 90%" },
      onUpdate: () => { n.textContent = Math.round(o.v) + (end >= 10 ? "+" : ""); }
    });
  });

  // ---------- generic fade-ups ----------
  const fadeUp = (sel, stagger) => {
    gsap.utils.toArray(sel).forEach((el) => {
      gsap.from(el, { y: 50, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } });
    });
  };
  fadeUp(".t-item");
  fadeUp(".ai-card");
  fadeUp(".skill-rows > div");
  fadeUp(".edu > div");
  fadeUp(".more-row a");
  fadeUp(".credits p");
  fadeUp("#enquiry-form");

  // ---------- poster image parallax + reveal ----------
  gsap.utils.toArray(".poster").forEach((p) => {
    const img = p.querySelector("img");
    gsap.from(p.querySelector(".poster-img"), {
      clipPath: "inset(0 0 100% 0)", duration: 1.4, ease: "power4.out",
      scrollTrigger: { trigger: p, start: "top 80%" }
    });
    gsap.fromTo(img, { yPercent: -8 }, {
      yPercent: 8, ease: "none",
      scrollTrigger: { trigger: p, start: "top bottom", end: "bottom top", scrub: true }
    });
    gsap.from(p.querySelector(".poster-info").children, {
      y: 40, opacity: 0, duration: 1, stagger: 0.1, ease: "power3.out",
      scrollTrigger: { trigger: p, start: "top 70%" }
    });
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
