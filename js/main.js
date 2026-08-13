/* ==========================================================================
   FuiEuQueFiz — main.js
   Nav scroll state, mobile nav toggle, scroll-reveal, smooth anchor scroll.
   ========================================================================== */

(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
     Cursor wood reveal — camada decorativa fixa injetada em toda página,
     com a foto assets/fundo.avif (madeira rústica) escondida atrás do
     fundo atual, revelada num círculo que segue o cursor com um pouco de
     atraso (lerp a cada frame, em vez de pular direto pra posição real —
     fica bem mais "smooth"). pointer-events:none o tempo todo, então
     nunca atrapalha cliques.

     Fica discreta (opacidade bem baixa, ver css/animations.css) sempre
     que o elemento embaixo do cursor tem conteúdo de verdade — foto,
     card, texto, botão — e "normal" só em áreas realmente vazias do
     fundo. isOverContent() decide isso a cada frame via elementFromPoint.
     ------------------------------------------------------------------ */
  if (!prefersReducedMotion) {
    var woodReveal = document.createElement("div");
    woodReveal.id = "wood-reveal";
    woodReveal.setAttribute("aria-hidden", "true");
    document.body.appendChild(woodReveal);

    var targetX = 0;
    var targetY = 0;
    var smoothX = 0;
    var smoothY = 0;
    var cursorLoopRunning = false;

    var CONTENT_TAGS = { IMG: 1, SVG: 1, BUTTON: 1, INPUT: 1, A: 1, SELECT: 1, TEXTAREA: 1 };

    var isOverContent = function (el) {
      if (!el || el === document.body || el === document.documentElement) return false;
      var cs = window.getComputedStyle(el);
      if (cs.backgroundImage && cs.backgroundImage !== "none") return true;
      if (CONTENT_TAGS[el.tagName]) return true;
      /* Só considera texto de elementos "folha" (sem filhos) — um wrapper
         flex/grid vazio (ex: espaço entre pills de filtro) tem textContent
         não-vazio por causa dos FILHOS dele, mas o próprio vão entre eles
         continua sendo fundo vazio. */
      if (el.children.length === 0 && el.textContent && el.textContent.trim().length > 0) return true;
      return false;
    };

    var cursorTick = function () {
      /* Suaviza a posição em vez de seguir o mouse 1:1 — o círculo "desliza"
         atrás do cursor com um pequeno atraso. */
      smoothX += (targetX - smoothX) * 0.12;
      smoothY += (targetY - smoothY) * 0.12;
      document.documentElement.style.setProperty("--cursor-x", smoothX + "px");
      document.documentElement.style.setProperty("--cursor-y", smoothY + "px");

      var elUnderCursor = document.elementFromPoint(smoothX, smoothY);
      document.body.classList.toggle("wood-reveal-discreet", isOverContent(elUnderCursor));

      if (cursorLoopRunning) window.requestAnimationFrame(cursorTick);
    };

    document.addEventListener(
      "mousemove",
      function (e) {
        targetX = e.clientX;
        targetY = e.clientY;
        document.body.classList.add("wood-reveal-active");
        if (!cursorLoopRunning) {
          cursorLoopRunning = true;
          smoothX = targetX;
          smoothY = targetY;
          window.requestAnimationFrame(cursorTick);
        }
      },
      { passive: true }
    );

    document.addEventListener("mouseleave", function () {
      document.body.classList.remove("wood-reveal-active");
      cursorLoopRunning = false; /* para o loop rAF — não fica rodando com o mouse fora da página */
    });
  }

  /* ------------------------------------------------------------------
     Nav scroll state
     ------------------------------------------------------------------ */
  var nav = document.querySelector(".nav-global");

  function updateNavScrollState() {
    if (!nav) return;
    if (window.scrollY > 8) {
      nav.classList.add("is-scrolled");
    } else {
      nav.classList.remove("is-scrolled");
    }
  }

  if (nav) {
    updateNavScrollState();
    window.addEventListener("scroll", updateNavScrollState, { passive: true });
  }

  /* ------------------------------------------------------------------
     Mobile hamburger toggle
     ------------------------------------------------------------------ */
  var hamburger = document.querySelector(".nav-hamburger");
  var navLinks = document.querySelector(".nav-links");

  function closeMobileNav() {
    if (!hamburger || !navLinks) return;
    hamburger.setAttribute("aria-expanded", "false");
    navLinks.classList.remove("is-open");
  }

  function openMobileNav() {
    if (!hamburger || !navLinks) return;
    hamburger.setAttribute("aria-expanded", "true");
    navLinks.classList.add("is-open");
  }

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", function () {
      var isOpen = hamburger.getAttribute("aria-expanded") === "true";
      if (isOpen) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });

    navLinks.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        closeMobileNav();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeMobileNav();
      }
    });
  }

  /* ------------------------------------------------------------------
     Scroll-reveal via IntersectionObserver
     ------------------------------------------------------------------ */
  var revealEls = document.querySelectorAll(".reveal");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ------------------------------------------------------------------
     Smooth-scroll for in-page anchor links
     ------------------------------------------------------------------ */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;

      var target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });

      if (typeof target.focus === "function") {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    });
  });
})();
