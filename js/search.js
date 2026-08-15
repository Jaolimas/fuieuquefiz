/* ==========================================================================
   FuiEuQueFiz — search.js
   Busca client-side sobre o catálogo (array global PRODUCTS, de
   js/products.js) — sem backend, sem índice separado. Self-mounting:
   injeta o painel de busca no <body> e escuta clique em #search-toggle
   (o ícone de lupa do nav, presente em todas as páginas). Roda em toda
   página, igual cart.js.
   ========================================================================== */

(function () {
  "use strict";

  var toggleButtons = document.querySelectorAll("#search-toggle");
  if (toggleButtons.length === 0) return;

  var MAX_RESULTS = 8;

  var scrimEl = document.createElement("div");
  scrimEl.className = "search-scrim";
  scrimEl.setAttribute("aria-hidden", "true");

  var panelEl = document.createElement("div");
  panelEl.className = "search-panel";
  panelEl.setAttribute("role", "dialog");
  panelEl.setAttribute("aria-modal", "true");
  panelEl.setAttribute("aria-label", "Buscar peças");

  panelEl.innerHTML =
    '<div class="search-input-row">' +
      '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">' +
        '<circle cx="9" cy="9" r="6.5" stroke="currentColor" stroke-width="1.6"/>' +
        '<line x1="13.6" y1="13.6" x2="18" y2="18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
      '</svg>' +
      '<input type="search" class="search-input" id="search-input" placeholder="Buscar peças, categorias..." autocomplete="off">' +
      '<button type="button" class="search-close" aria-label="Fechar busca">' +
        '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' +
      '</button>' +
    '</div>' +
    '<div class="search-results" id="search-results"></div>';

  document.body.appendChild(scrimEl);
  document.body.appendChild(panelEl);

  var inputEl = panelEl.querySelector("#search-input");
  var resultsEl = panelEl.querySelector("#search-results");
  var closeBtn = panelEl.querySelector(".search-close");

  function normalize(str) {
    return (str || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, ""); /* remove acentos (á→a, ç→c, ...) pra busca não depender de digitar acento certo */
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function matches(product, needle) {
    return (
      normalize(product.name).indexOf(needle) !== -1 ||
      normalize(product.category).indexOf(needle) !== -1 ||
      normalize(product.short).indexOf(needle) !== -1
    );
  }

  function renderResults(query) {
    var trimmed = query.trim();

    if (!trimmed) {
      resultsEl.innerHTML = '<p class="search-hint">Digite o nome de uma peça, categoria ou material — ex: "mesa", "aparador", "tronco".</p>';
      return;
    }

    var needle = normalize(trimmed);
    var found = (typeof PRODUCTS !== "undefined" ? PRODUCTS : []).filter(function (p) {
      return matches(p, needle);
    });

    if (found.length === 0) {
      resultsEl.innerHTML =
        '<p class="search-hint">Nenhuma peça encontrada para "' + escapeHtml(trimmed) + '".</p>' +
        '<a class="search-catalog-link" href="catalogo.html">Ver catálogo completo →</a>';
      return;
    }

    var shown = found.slice(0, MAX_RESULTS);

    resultsEl.innerHTML = shown
      .map(function (p) {
        return (
          '<a class="search-result-item" href="produto.html?slug=' + encodeURIComponent(p.slug) + '">' +
            '<img src="' + p.image + '" alt="" loading="lazy">' +
            '<span class="search-result-text">' +
              '<span class="search-result-name">' + escapeHtml(p.name) + '</span>' +
              '<span class="search-result-meta">' + escapeHtml(p.category) + ' · ' + formatBRL(p.price) + '</span>' +
            '</span>' +
          '</a>'
        );
      })
      .join("") +
      (found.length > MAX_RESULTS
        ? '<a class="search-catalog-link" href="catalogo.html">Ver todos os ' + found.length + ' resultados →</a>'
        : "");
  }

  function open() {
    scrimEl.classList.add("is-open");
    panelEl.classList.add("is-open");
    renderResults(inputEl.value);
    window.setTimeout(function () { inputEl.focus(); }, 50);
  }

  function close() {
    scrimEl.classList.remove("is-open");
    panelEl.classList.remove("is-open");
  }

  toggleButtons.forEach(function (btn) {
    btn.addEventListener("click", open);
  });

  scrimEl.addEventListener("click", close);
  closeBtn.addEventListener("click", close);

  inputEl.addEventListener("input", function () {
    renderResults(inputEl.value);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && panelEl.classList.contains("is-open")) {
      close();
    }
  });
})();
