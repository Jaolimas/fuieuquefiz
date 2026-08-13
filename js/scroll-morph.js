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

   Cross-sell ("Combina bem com"): cada slide também tem data-cross com 1-2
   slugs separados por vírgula (peças complementares, curadas à mão). Os
   dados completos (nome/preço/imagem) desses slugs vêm do array global
   PRODUCTS (js/products.js) — nunca duplicados aqui, só referenciados por
   slug, pra não sair de sincronia se um preço mudar.
   ========================================================================== */

(function () {
  "use strict";

  var section = document.querySelector(".morph-section");
  if (!section) return;

  var carousel = section.querySelector("#morph-carousel");
  var caption = section.querySelector(".morph-caption");
  var progressFill = section.querySelector(".morph-progress-fill");
  var progressBar = section.querySelector(".morph-progress");
  var crossSellItemsEl = section.querySelector(".morph-crosssell-items");
  var crossSellAddAllBtn = section.querySelector(".morph-crosssell-add-all");
  var crossSellStatusEl = section.querySelector(".morph-crosssell-status");

  if (!carousel) return;

  var items = Array.prototype.slice.call(carousel.querySelectorAll(".morph-carousel-item"));
  if (items.length === 0) return;

  var productsBySlug = {};
  (typeof PRODUCTS !== "undefined" ? PRODUCTS : []).forEach(function (p) {
    productsBySlug[p.slug] = p;
  });

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  /* Monta os chips "Combina bem com" + o botão "Adicionar os N" a partir
     do data-cross do slide ativo — sempre que a peça em destaque muda. */
  function updateCrossSell(activeItem) {
    if (!crossSellItemsEl || !crossSellAddAllBtn) return;

    var mainSlug = activeItem.getAttribute("href").split("slug=")[1];
    var mainProduct = productsBySlug[mainSlug];
    var crossSlugs = (activeItem.dataset.cross || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    var crossProducts = crossSlugs.map(function (slug) { return productsBySlug[slug]; }).filter(Boolean);

    if (crossSellStatusEl) crossSellStatusEl.textContent = "";

    if (!mainProduct || crossProducts.length === 0) {
      crossSellItemsEl.innerHTML = "";
      crossSellAddAllBtn.hidden = true;
      return;
    }

    crossSellAddAllBtn.hidden = false;

    crossSellItemsEl.innerHTML = crossProducts.map(function (p) {
      return (
        '<a class="morph-crosssell-chip" href="produto.html?slug=' + encodeURIComponent(p.slug) + '">' +
          '<img src="' + p.image + '" alt="">' +
          '<span class="morph-crosssell-chip-text">' +
            '<span class="morph-crosssell-chip-name">' + escapeHtml(p.name) + '</span>' +
            '<span class="morph-crosssell-chip-price">' + formatBRL(p.price) + '</span>' +
          '</span>' +
        '</a>'
      );
    }).join("");

    var allProducts = [mainProduct].concat(crossProducts);
    var total = allProducts.reduce(function (sum, p) { return sum + p.price; }, 0);
    crossSellAddAllBtn.textContent = "Adicionar os " + allProducts.length + " — " + formatBRL(total);

    crossSellAddAllBtn.onclick = function () {
      if (!window.Cart) return;
      allProducts.forEach(function (p) {
        window.Cart.addToCart({ slug: p.slug, name: p.name, unitPrice: p.price, qty: 1 });
      });
      if (crossSellStatusEl) crossSellStatusEl.textContent = "Adicionado à sua lista ✓";
      if (window.Cart.open) window.Cart.open();
    };
  }

  function setActive(index) {
    items.forEach(function (item, i) {
      item.classList.toggle("is-active", i === index);
    });
    var active = items[index];
    if (caption) {
      caption.textContent = active.dataset.name + " — " + active.dataset.price;
    }
    updateCrossSell(active);
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
