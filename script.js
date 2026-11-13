function locomotiveScrollTriggerSetup() {

  gsap.registerPlugin(ScrollTrigger);

  // Using Locomotive Scroll from Locomotive https://github.com/locomotivemtl/locomotive-scroll

  const locoScroll = new LocomotiveScroll({
    el: document.querySelector("main"),
    smooth: true
  });
  // each time Locomotive Scroll updates, tell ScrollTrigger to update too (sync positioning)
  locoScroll.on("scroll", ScrollTrigger.update);

  // tell ScrollTrigger to use these proxy methods for the "main" element since Locomotive Scroll is hijacking things
  ScrollTrigger.scrollerProxy("main", {
    scrollTop(value) {
      return arguments.length ? locoScroll.scrollTo(value, 0, 0) : locoScroll.scroll.instance.scroll.y;
    }, // we don't have to define a scrollLeft because we're only scrolling vertically.
    getBoundingClientRect() {
      return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
    },
    // LocomotiveScroll handles things completely differently on mobile devices - it doesn't even transform the container at all! So to get the correct behavior and avoid jitters, we should pin things with position: fixed on mobile. We sense it by checking to see if there's a transform applied to the container (the LocomotiveScroll-controlled element).
    pinType: document.querySelector("main").style.transform ? "transform" : "fixed"
  });

  // each time the window updates, we should refresh ScrollTrigger and then update LocomotiveScroll. 
  ScrollTrigger.addEventListener("refresh", () => locoScroll.update());

  // after everything is set up, refresh() ScrollTrigger and update LocomotiveScroll because padding may have been added for pinning, etc.
  ScrollTrigger.refresh();

}

// rotating an arrow in navbar
function rotatingArrow() {

  gsap.to("nav svg", {
    rotate: 90,
    duration: 1,
    backgroundColor: "#111",
    scrollTrigger: {
      trigger: "nav svg",
      scroller: "main",
      start: "top -5%",
      end: "top -6%",
      scrub: 1
    }
  })
  gsap.to("nav svg", {
    backgroundColor: "#111",
    scrollTrigger: {
      trigger: "nav svg",
      scroller: "main",
      start: "top -15%",
      end: "top -400%",
      scrub: 3
    }
  })
}

// scrolling a namediv
function scrollingNamediv() {

  gsap.to("#name-div h1", {
    transform: "translateX(calc(-100% - 2vw - 4px))",
    scrollTrigger: {
      trigger: "#name-div h1",
      scroller: "main",
      // markers:true,
      scrub: 0.7
    }
  })



  gsap.from("#intro-div h1:nth-child(1)", {
    scrollTrigger: {
      trigger: "#intro-div h1:nth-child(1)",
      scroller: "main",
      // markers: true,
      start: "top 70%"
    },
    opacity: 0
  })
  gsap.from("#intro-div h1:nth-child(2)", {

    scrollTrigger: {
      trigger: "#intro-div h1:nth-child(2)",
      scroller: "main",
      // markers: true,
      start: "top 60%"
    },
    duration: 1,
    opacity: 0
  })
  gsap.from("#intro-div h1:nth-child(3)", {
    scrollTrigger: {
      trigger: "#intro-div h1:nth-child(3)",
      scroller: "main",
      // markers: true,
      start: "top 60%",
    },
    opacity: 0,
    duration: 1,
  })

  gsap.from(".box h4", {
    opacity: 0,
    scrollTrigger: {
      trigger: ".box h4",
      scroller: "main",
      // markers:true,
      start: "top 70%"
    },
    stagger: 0.5
  })

  gsap.from(".dev-box img", {
    opacity: 0,
    scrollTrigger: {
      trigger: ".dev-box img",
      scroller: "main",
      // markers:true,
      start: "top 80%"
    },
    y: 20,
    stagger: {
      amount: 2
    }

  })
  gsap.from(".des-box img", {
    opacity: 0,
    scrollTrigger: {
      trigger: ".des-box img",
      scroller: "main",
      // markers:true,
      start: "top 80%"
    },
    y: 20,
    stagger: {
      amount: 1
    }

  })
}
function skillsAnimation() {
  gsap.from(".skill-card img", {
    scale: 0,
    opacity: 0,
    duration: 0.8,
    stagger: 0.1,
    ease: "back.out(1.7)",
    scrollTrigger: {
      trigger: "#skills",
      scroller: "main",
      start: "top 80%"
    }
  });
}

function hoverEffects() {
  const contact = document.querySelector(".page7");
  const cursor = document.querySelector(".cursor");

  if (contact && cursor) {
    contact.addEventListener("mouseenter", () => { cursor.style.opacity = 1; });
    contact.addEventListener("mousemove", (e) => {
      cursor.style.left = e.clientX + "px";
      cursor.style.top = e.clientY + "px";
    });
    contact.addEventListener("mouseleave", () => { cursor.style.opacity = 0; });
  }

  document.querySelectorAll(".elem").forEach((val) => {
    const img = val.querySelector("img");
    if (!img) return;
    val.addEventListener("mouseenter", () => { img.style.opacity = 1; });
    val.addEventListener("mouseleave", () => { img.style.opacity = 0; });
    val.addEventListener("mousemove", (e) => { img.style.left = e.clientX + "px"; });
  });
}

function setupContactForm() {
  const form = document.getElementById("enquiry-form");
  const status = document.getElementById("form-status");
  const button = form.querySelector("button[type=submit]");

  // EmailJS public key (safe to expose; restrict allowed domains in the EmailJS dashboard)
  emailjs.init("gDOm08i95Bwjfs1s_");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    button.disabled = true;
    status.innerText = "Sending...";

    emailjs.sendForm("service_ogydzk3", "template_5ylpwlc", form)
      .then(() => {
        status.innerText = "Message sent successfully!";
        form.reset();
      })
      .catch((error) => {
        status.innerText = "Failed to send message. Try again!";
        console.error("Error:", error);
      })
      .finally(() => { button.disabled = false; });
  });
}

locomotiveScrollTriggerSetup();
rotatingArrow();
scrollingNamediv();
skillsAnimation();
hoverEffects();
setupContactForm();
