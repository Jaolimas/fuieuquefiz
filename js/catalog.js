/* ==========================================================================
   FuiEuQueFiz — catalog.js
   Renders the 20-product grid on catalogo.html, with category filter pills
   and a sort <select>. Loaded after products.js and cart.js.

   Note on reveal-on-scroll: main.js wires its IntersectionObserver up to
   every .reveal element present at DOMContentLoaded — but this grid starts
   empty and is populated here, after that observer has already run its
   initial sweep. Rather than re-implementing observer wiring for
   dynamically-inserted nodes, cards rendered by this file get
   ".reveal is-visible" applied directly at render time (no scroll-triggered
   fade-in for catalog cards) — simplest robust fix, per the task brief.
   ========================================================================== */

(function () {
  "use strict";

  var grid = document.getElementById("catalog-grid");
  var pillsContainer = document.getElementById("filter-pills");
  var sortSelect = document.getElementById("sort-select");

  if (!grid) return;

  var activeCategory = "Todos";
  var activeSort = "relevancia";

  function buildCard(product) {
    var index = PRODUCTS.indexOf(product);

    var card = document.createElement("article");
    card.className = "card reveal is-visible";

    card.innerHTML =
      '<a href="produto.html?slug=' + encodeURIComponent(product.slug) + '" class="product-card-link">' +
        '<div class="product-shot' + productShotClass(product, index) + '">' +
          productShotHTML(product, index) +
        '</div>' +
        '<h3 class="product-name">' + product.name + '</h3>' +
        '<p class="product-price">' + formatBRL(product.price) + '</p>' +
        '<span class="product-link">Ver peça →</span>' +
      '</a>';

    return card;
  }

  function getFilteredSorted() {
    var list = activeCategory === "Todos"
      ? PRODUCTS.slice()
      : PRODUCTS.filter(function (p) { return p.category === activeCategory; });

    if (activeSort === "menor-preco") {
      list.sort(function (a, b) { return a.price - b.price; });
    } else if (activeSort === "maior-preco") {
      list.sort(function (a, b) { return b.price - a.price; });
    }
    /* "relevancia" — keep original catalog order */

    return list;
  }

  function render() {
    var list = getFilteredSorted();
    grid.innerHTML = "";

    if (list.length === 0) {
      var empty = document.createElement("p");
      empty.className = "catalog-empty";
      empty.textContent = "Nenhuma peça encontrada com esse filtro. Experimente outra categoria.";
      grid.appendChild(empty);
      return;
    }

    list.forEach(function (product) {
      grid.appendChild(buildCard(product));
    });
  }

  function buildPills() {
    if (!pillsContainer) return;

    CATEGORIES.forEach(function (category) {
      var pill = document.createElement("button");
      pill.type = "button";
      pill.className = "chip filter-pill";
      pill.textContent = category;
      pill.setAttribute("aria-pressed", category === activeCategory ? "true" : "false");
      if (category === activeCategory) {
        pill.classList.add("chip--selected");
      }

      pill.addEventListener("click", function () {
        activeCategory = category;
        pillsContainer.querySelectorAll(".filter-pill").forEach(function (p) {
          var isActive = p === pill;
          p.classList.toggle("chip--selected", isActive);
          p.setAttribute("aria-pressed", isActive ? "true" : "false");
        });
        render();
      });

      pillsContainer.appendChild(pill);
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", function () {
      activeSort = sortSelect.value;
      render();
    });
  }

  buildPills();
  render();
})();
