/* ==========================================================================
   FuiEuQueFiz — product-page.js
   Builds the product detail page (#pdp-root + #related-products) from
   PRODUCTS, driven by ?slug= in the URL. Loaded after products.js, cart.js.

   Note on reveal-on-scroll: like catalog.js, the related-product cards are
   inserted after main.js's initial IntersectionObserver sweep, so they get
   ".reveal is-visible" applied directly at render time instead of being
   wired into the scroll observer.
   ========================================================================== */

(function () {
  "use strict";

  var pdpRoot = document.getElementById("pdp-root");
  var relatedGrid = document.getElementById("related-products");
  if (!pdpRoot) return;

  var params = new URLSearchParams(window.location.search);
  var slug = params.get("slug");
  var product = PRODUCTS.filter(function (p) { return p.slug === slug; })[0];

  if (!product) {
    pdpRoot.innerHTML =
      '<div class="pdp-not-found">' +
        '<h1>Peça não encontrada.</h1>' +
        '<p>Essa peça pode ter sido removida ou o link está incorreto.</p>' +
        '<a class="btn btn--primary" href="catalogo.html">Ver catálogo</a>' +
      '</div>';

    var relatedSection = relatedGrid ? relatedGrid.closest("section") : null;
    if (relatedSection) relatedSection.style.display = "none";
    return;
  }

  document.title = product.name + " — FuiEuQueFiz";

  var productIndex = PRODUCTS.indexOf(product);
  var finishGroups = getFinishGroups(product);

  /* ------------------------------------------------------------------
     State
     ------------------------------------------------------------------ */
  var state = {
    sizeIndex: 0,
    finishes: {}, /* groupName -> selected option */
    qty: 1,
    activeImageIndex: 0 /* qual foto da galeria está em destaque (0 = product.image) */
  };

  /* Produtos com mais de uma foto (vários ângulos) têm product.gallery —
     [imagem principal, ...ângulos extras]. Produtos sem gallery mostram só
     a foto única de sempre, sem miniaturas. */
  function galleryImages() {
    return product.gallery && product.gallery.length ? [product.image].concat(product.gallery) : null;
  }

  finishGroups.forEach(function (group) {
    state.finishes[group.group] = group.options[0];
  });

  function currentUnitPrice() {
    var price = product.price;
    if (product.sizeVariants) {
      price += product.sizeVariants[state.sizeIndex].priceDelta;
    }
    return price;
  }

  function groupShortLabel(group) {
    var materials = (product.materials || "").toLowerCase();
    if (group === "Acabamento do metal") {
      if (materials.indexOf("aço") !== -1 && materials.indexOf("ferro") === -1) return "Aço";
      return "Ferro";
    }
    if (group === "Tom da madeira") return "Madeira";
    return group;
  }

  function buildConfigSummary() {
    var parts = [];

    if (product.sizeVariants) {
      parts.push(product.sizeVariants[state.sizeIndex].label);
    }

    finishGroups.forEach(function (group) {
      parts.push(groupShortLabel(group.group) + ": " + state.finishes[group.group]);
    });

    return parts.join(" · ");
  }

  /* ------------------------------------------------------------------
     Render
     ------------------------------------------------------------------ */

  var buyBarObserver = null;

  function specRow(label, value) {
    return (
      '<div class="pdp-spec-row">' +
        '<span class="pdp-spec-label">' + label + '</span>' +
        '<span class="pdp-spec-value">' + value + '</span>' +
      '</div>'
    );
  }

  function renderSizeChips() {
    if (!product.sizeVariants) return "";

    var chips = product.sizeVariants.map(function (variant, i) {
      var suffix = variant.priceDelta !== 0 ? ' <span>(' + formatBRLDelta(variant.priceDelta) + ')</span>' : "";
      var selected = i === state.sizeIndex ? " chip--selected" : "";
      return (
        '<button type="button" class="chip' + selected + '" data-kind="size" data-index="' + i + '" aria-pressed="' + (i === state.sizeIndex) + '">' +
          variant.label + suffix +
        '</button>'
      );
    }).join("");

    return (
      '<div class="pdp-finish-group">' +
        '<span class="pdp-finish-label">Tamanho</span>' +
        '<div class="pdp-finish-chips">' + chips + '</div>' +
      '</div>'
    );
  }

  function renderGalleryThumbs(images) {
    var thumbs = images.map(function (src, i) {
      var selected = i === state.activeImageIndex ? " is-active" : "";
      return (
        '<button type="button" class="pdp-gallery-thumb' + selected + '" data-index="' + i + '" aria-label="Ver foto ' + (i + 1) + ' de ' + images.length + '">' +
          '<img src="' + src + '" alt="">' +
        '</button>'
      );
    }).join("");

    return '<div class="pdp-gallery-thumbs">' + thumbs + '</div>';
  }

  function renderFinishGroups() {
    return finishGroups.map(function (group) {
      var chips = group.options.map(function (option) {
        var selected = state.finishes[group.group] === option ? " chip--selected" : "";
        return (
          '<button type="button" class="chip' + selected + '" data-kind="finish" data-group="' + group.group + '" data-option="' + option + '" aria-pressed="' + (state.finishes[group.group] === option) + '">' +
            option +
          '</button>'
        );
      }).join("");

      return (
        '<div class="pdp-finish-group">' +
          '<span class="pdp-finish-label">' + group.group + '</span>' +
          '<div class="pdp-finish-chips">' + chips + '</div>' +
        '</div>'
      );
    }).join("");
  }

  function render() {
    var images = galleryImages();
    var mainImageSrc = images ? images[state.activeImageIndex] : product.image;

    pdpRoot.innerHTML =
      '<div class="pdp-media">' +
        '<div class="product-shot' + productShotClass(product, productIndex) + '">' +
          (product.image ? '<img src="' + mainImageSrc + '" alt="' + product.name + '" loading="eager">' : productShotHTML(product, productIndex)) +
        '</div>' +
        (images ? renderGalleryThumbs(images) : '') +
      '</div>' +
      '<div class="pdp-info">' +
        '<h1 class="pdp-name">' + product.name + '</h1>' +
        '<p class="pdp-price" id="pdp-price">' + formatBRL(currentUnitPrice()) + '</p>' +
        '<p class="pdp-short">' + product.short + '</p>' +
        '<p class="pdp-description">' + product.description + '</p>' +
        '<div class="pdp-specs">' +
          specRow("Materiais", product.materials) +
          specRow("Dimensões", product.dimensions) +
          specRow("Prazo de produção", product.leadTime) +
        '</div>' +
        renderSizeChips() +
        renderFinishGroups() +
        '<div class="pdp-qty-row">' +
          '<span class="pdp-finish-label">Quantidade</span>' +
          '<div class="pdp-qty-stepper">' +
            '<button type="button" class="pdp-qty-btn" id="pdp-qty-minus" aria-label="Diminuir quantidade">−</button>' +
            '<span class="pdp-qty-value" id="pdp-qty-value">' + state.qty + '</span>' +
            '<button type="button" class="pdp-qty-btn" id="pdp-qty-plus" aria-label="Aumentar quantidade">+</button>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="btn btn--primary pdp-add-btn" id="pdp-add-btn">Adicionar ao carrinho</button>' +
      '</div>';

    wireEvents();
    updateBuyBar();
    observeAddButton();
  }

  function wireEvents() {
    pdpRoot.querySelectorAll(".pdp-gallery-thumb").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.activeImageIndex = parseInt(btn.getAttribute("data-index"), 10);
        render();
      });
    });

    pdpRoot.querySelectorAll('[data-kind="size"]').forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.sizeIndex = parseInt(btn.getAttribute("data-index"), 10);
        render();
      });
    });

    pdpRoot.querySelectorAll('[data-kind="finish"]').forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.finishes[btn.getAttribute("data-group")] = btn.getAttribute("data-option");
        render();
      });
    });

    var minusBtn = document.getElementById("pdp-qty-minus");
    var plusBtn = document.getElementById("pdp-qty-plus");
    var qtyValue = document.getElementById("pdp-qty-value");

    if (minusBtn) {
      minusBtn.addEventListener("click", function () {
        if (state.qty > 1) {
          state.qty -= 1;
          qtyValue.textContent = state.qty;
          updateBuyBar();
        }
      });
    }

    if (plusBtn) {
      plusBtn.addEventListener("click", function () {
        state.qty += 1;
        qtyValue.textContent = state.qty;
        updateBuyBar();
      });
    }

    var addBtn = document.getElementById("pdp-add-btn");
    if (addBtn) {
      addBtn.addEventListener("click", handleAdd);
    }
  }

  function handleAdd() {
    addToCart({
      slug: product.slug,
      name: product.name,
      unitPrice: currentUnitPrice(),
      configSummary: buildConfigSummary(),
      /* Machine-readable size label (not just the freeform configSummary text) so the
         backend (api/create-order.js) can look up the exact priceDelta in data/products.json
         and recompute the total server-side, instead of trusting the price sent by the browser. */
      sizeVariantLabel: product.sizeVariants ? product.sizeVariants[state.sizeIndex].label : null,
      qty: state.qty
    });

    var originalText = "Adicionar ao carrinho";
    [document.getElementById("pdp-add-btn"), document.getElementById("buy-bar-add-btn")].forEach(function (btn) {
      if (!btn) return;
      btn.textContent = "Adicionado ✓";
      window.setTimeout(function () {
        if (btn) btn.textContent = originalText;
      }, 1500);
    });
  }

  /* ------------------------------------------------------------------
     Floating buy bar
     ------------------------------------------------------------------ */

  var buyBar = document.createElement("div");
  buyBar.className = "buy-bar";
  buyBar.innerHTML =
    '<div class="buy-bar-info">' +
      '<span class="buy-bar-name">' + product.name + '</span>' +
      '<span class="buy-bar-price" id="buy-bar-price">' + formatBRL(currentUnitPrice()) + '</span>' +
    '</div>' +
    '<button type="button" class="btn btn--primary" id="buy-bar-add-btn">Adicionar ao carrinho</button>';
  document.body.appendChild(buyBar);
  buyBar.querySelector("#buy-bar-add-btn").addEventListener("click", handleAdd);

  function updateBuyBar() {
    var priceEl = document.getElementById("buy-bar-price");
    if (priceEl) priceEl.textContent = formatBRL(currentUnitPrice());
  }

  function observeAddButton() {
    var addBtn = document.getElementById("pdp-add-btn");
    if (!addBtn) return;

    if (buyBarObserver) buyBarObserver.disconnect();

    if (!("IntersectionObserver" in window)) return;

    buyBarObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        buyBar.classList.toggle("is-visible", !entry.isIntersecting);
      });
    }, { threshold: 0 });

    buyBarObserver.observe(addBtn);
  }

  /* ------------------------------------------------------------------
     Related products
     ------------------------------------------------------------------ */

  function renderRelated() {
    if (!relatedGrid) return;

    var sameCategory = PRODUCTS.filter(function (p) {
      return p.slug !== product.slug && p.category === product.category;
    });

    var others = PRODUCTS.filter(function (p) {
      return p.slug !== product.slug && p.category !== product.category;
    });

    var picks = sameCategory.slice(0, 3);
    if (picks.length < 3) {
      picks = picks.concat(others.slice(0, 3 - picks.length));
    }

    relatedGrid.innerHTML = "";

    picks.forEach(function (relatedProduct) {
      var idx = PRODUCTS.indexOf(relatedProduct);
      var card = document.createElement("article");
      card.className = "card reveal is-visible";
      card.innerHTML =
        '<a href="produto.html?slug=' + encodeURIComponent(relatedProduct.slug) + '" class="product-card-link">' +
          '<div class="product-shot' + productShotClass(relatedProduct, PRODUCTS.indexOf(relatedProduct)) + '">' +
            productShotHTML(relatedProduct, PRODUCTS.indexOf(relatedProduct)) +
          '</div>' +
          '<h3 class="product-name">' + relatedProduct.name + '</h3>' +
          '<p class="product-price">' + formatBRL(relatedProduct.price) + '</p>' +
          '<span class="product-link">Ver peça →</span>' +
        '</a>';
      relatedGrid.appendChild(card);
    });
  }

  render();
  renderRelated();
})();
