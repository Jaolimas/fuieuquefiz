/* ==========================================================================
   FuiEuQueFiz — scroll-morph.js
   Carrossel de vitrine com "scroll travado": a seção fica pinada (position:
   sticky) ocupando 100vh enquanto o usuário rola por uma faixa bem mais
   alta (.morph-section), e a posição do scroll dentro dessa faixa decide
   qual peça do carrossel está visível — cada trecho de rolagem equivale a
   um slide, para frente ou para trás, sem nenhuma lógica separada por
   direção (mesma matemática nos dois sentidos).

   Cada slide é um <a class="morph-carousel-item"> com data-name/data-price,
   usados para montar a legenda — trocar/reordenar peças é só editar o HTML
   em index.html, sem tocar neste arquivo.
   ========================================================================== */

(function () {
  "use strict";

  var section = document.querySelector(".morph-section");
  if (!section) return;

  var carousel = section.querySelector("#morph-carousel");
  var caption = section.querySelector(".morph-caption");
  var progressFill = section.querySelector(".morph-progress-fill");
  var progressBar = section.querySelector(".morph-progress");

  if (!carousel) return;

  var items = Array.prototype.slice.call(carousel.querySelectorAll(".morph-carousel-item"));
  if (items.length === 0) return;

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function setActive(index) {
    items.forEach(function (item, i) {
      item.classList.toggle("is-active", i === index);
    });
    if (caption) {
      var active = items[index];
      caption.textContent = active.dataset.name + " — " + active.dataset.price;
    }
  }

  if (prefersReducedMotion) {
    // Sem scroll-jacking para quem prefere menos movimento — mostra a
    // primeira peça, parada, sem barra de progresso.
    setActive(0);
    if (progressBar) progressBar.style.display = "none";
    return;
  }

  var ticking = false;
  var lastIndex = -1;

  function update() {
    ticking = false;

    var rect = section.getBoundingClientRect();
    var viewportHeight = window.innerHeight;
    var scrollableDistance = rect.height - viewportHeight;

    var progress = scrollableDistance > 0 ? clamp(-rect.top / scrollableDistance, 0, 1) : 0;
    var index = clamp(Math.floor(progress * items.length), 0, items.length - 1);

    if (index !== lastIndex) {
      setActive(index);
      lastIndex = index;
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

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();
})();
