/* ==========================================================================
   FuiEuQueFiz — scroll-morph.js
   Scroll-driven "revelação sob a luz" video: câmera 100% travada sobre a
   mesa de jantar principal, começando quase no escuro e sendo revelada
   progressivamente por uma luz quente que varre a peça (frame 0 = quase
   no breu, frame final = peça totalmente iluminada, still de produto).
   Não há "volta ao escuro" gravada no próprio vídeo — isso acontece porque
   o scroll para cima simplesmente busca `currentTime` para trás na mesma
   filmagem.

   Scroll para baixo avança o vídeo, scroll para cima recua — o vídeo fica
   pausado, e cada frame é escolhido diretamente por
   `video.currentTime = progress * video.duration`, então ele naturalmente
   "vai e volta" com a direção do scroll (mesma matemática nos dois sentidos,
   sem lógica separada para ida/volta).

   Vídeo gerado via Higgsfield (ver HIGGSFIELD_PROMPTS.md para o prompt
   usado e como gerar variações). Fica em assets/scroll-video/mesa-reveal.mp4.
   ========================================================================== */

(function () {
  "use strict";

  var section = document.querySelector(".morph-section");
  if (!section) return;

  var video = section.querySelector("#morph-video");
  var caption = section.querySelector(".morph-caption");
  var progressFill = section.querySelector(".morph-progress-fill");
  var progressBar = section.querySelector(".morph-progress");

  if (!video) return;

  var CAPTIONS = [
    { at: 0, text: "Um convite para olhar de perto." },
    { at: 0.5, text: "Madeira maciça. Ferro forjado à mão. Sob encomenda, só para você." }
  ];

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    // Poster já é o still totalmente revelado/iluminado — usar a legenda final.
    if (caption) caption.textContent = CAPTIONS[CAPTIONS.length - 1].text;
    if (progressBar) progressBar.style.display = "none";
    return;
  }

  var ticking = false;
  var duration = 0;
  var lastCaptionText = "";

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function captionForProgress(progress) {
    var current = CAPTIONS[0].text;
    for (var i = 0; i < CAPTIONS.length; i++) {
      if (progress >= CAPTIONS[i].at) current = CAPTIONS[i].text;
    }
    return current;
  }

  function update() {
    ticking = false;

    var rect = section.getBoundingClientRect();
    var viewportHeight = window.innerHeight;
    var scrollableDistance = rect.height - viewportHeight;

    var progress = scrollableDistance > 0 ? clamp(-rect.top / scrollableDistance, 0, 1) : 0;

    if (duration > 0) {
      video.currentTime = progress * duration;
    }

    if (caption) {
      var text = captionForProgress(progress);
      if (text !== lastCaptionText) {
        caption.textContent = text;
        lastCaptionText = text;
      }
    }

    if (progressFill) {
      progressFill.style.width = progress * 100 + "%";
    }
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }

  video.addEventListener("loadedmetadata", function () {
    duration = video.duration || 0;
    update();
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();
})();
