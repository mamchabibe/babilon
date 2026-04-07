const revealEls = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealEls.forEach((el, index) => {
    el.style.transitionDelay = `${Math.min(index * 40, 240)}ms`;
    observer.observe(el);
  });
} else {
  revealEls.forEach((el) => el.classList.add("is-visible"));
}

const menuToggle = document.getElementById("menuToggle");
const navShell = document.getElementById("navShell");

if (menuToggle && navShell) {
  const closeMenu = () => {
    navShell.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  };

  menuToggle.addEventListener("click", () => {
    const isOpen = navShell.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navShell.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 820) {
      closeMenu();
    }
  });
}

const entryForm = document.getElementById("entryForm");
const entryFeedback = document.getElementById("entryFeedback");

entryForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (entryFeedback) {
    entryFeedback.textContent = "Placeholder captured locally. In the real build, this will connect to registration or a waitlist backend.";
  }
});
