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

const MUSIC_STORAGE_KEY = "babilon-music-muted";

function getMusicSource() {
  const path = window.location.pathname.toLowerCase();
  const lastSegment = path.split("/").pop() || "";
  const requestedFloor = new URLSearchParams(window.location.search).get("floor");
  const isHomePath =
    !path.includes("/pages/") &&
    (!lastSegment || lastSegment === "index.html" || !lastSegment.includes("."));

  if (isHomePath) {
    return {
      src: "assets/music/home.mp3",
      label: "Home music"
    };
  }

  if (lastSegment === "floor.html" && requestedFloor === "8") {
    return {
      src: "../assets/music/floor 8.mp3",
      label: "Floor 8 music"
    };
  }

  return null;
}

function initPageMusic() {
  const musicConfig = getMusicSource();

  if (!musicConfig) {
    return;
  }

  const audio = new Audio(musicConfig.src);
  const initiallyMuted = window.localStorage.getItem(MUSIC_STORAGE_KEY) === "true";
  const toggle = document.createElement("button");
  let hasInteractedForPlayback = false;

  audio.loop = true;
  audio.preload = "auto";
  audio.volume = 0.45;
  audio.muted = initiallyMuted;
  audio.setAttribute("aria-label", musicConfig.label);

  toggle.type = "button";
  toggle.className = "music-toggle";

  function syncToggleLabel() {
    const isMuted = audio.muted;
    toggle.textContent = isMuted ? "Music off" : "Music on";
    toggle.setAttribute("aria-pressed", String(!isMuted));
  }

  async function playAudio() {
    if (audio.muted) {
      return;
    }

    try {
      await audio.play();
    } catch (error) {
      // Autoplay may be blocked until the user interacts with the page.
    }
  }

  function rememberMuteState() {
    window.localStorage.setItem(MUSIC_STORAGE_KEY, String(audio.muted));
  }

  function handleFirstInteraction() {
    if (hasInteractedForPlayback) {
      return;
    }

    hasInteractedForPlayback = true;
    playAudio();
    window.removeEventListener("pointerdown", handleFirstInteraction);
    window.removeEventListener("keydown", handleFirstInteraction);
  }

  toggle.addEventListener("click", async () => {
    audio.muted = !audio.muted;
    rememberMuteState();
    syncToggleLabel();

    if (audio.muted) {
      audio.pause();
      return;
    }

    await playAudio();
  });

  document.body.appendChild(toggle);
  syncToggleLabel();
  playAudio();

  window.addEventListener("pointerdown", handleFirstInteraction);
  window.addEventListener("keydown", handleFirstInteraction);
}

initPageMusic();
