/* ==========================================================================
   FuiEuQueFiz — cart.js
   Self-mounting shopping cart + WhatsApp checkout. Included on every page
   (index.html, catalogo.html, produto.html). Builds its own drawer markup
   and injects it into <body> on DOMContentLoaded — no HTML authoring
   required per-page beyond the <script> tag and a #cart-toggle button
   somewhere in the nav (already present via the reusable nav markup).

   Cart state persists in localStorage under "fuieuquefiz_cart" as an
   array of { slug, name, unitPrice, configSummary, qty }.
   ========================================================================== */

(function () {
  "use strict";

  var STORAGE_KEY = "fuieuquefiz_cart";

  var drawerEl = null;
  var scrimEl = null;
  var isOpen = false;

  /* ------------------------------------------------------------------
     State
     ------------------------------------------------------------------ */

  function readCart() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function writeCart(items) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      /* localStorage unavailable — cart simply won't persist across reloads */
    }
  }

  function findLineIndex(items, slug, configSummary) {
    for (var i = 0; i < items.length; i++) {
      if (items[i].slug === slug && items[i].configSummary === configSummary) {
        return i;
      }
    }
    return -1;
  }

  function addToCart(item) {
    var items = readCart();
    var existingIndex = findLineIndex(items, item.slug, item.configSummary || "");

    if (existingIndex !== -1) {
      items[existingIndex].qty += item.qty || 1;
    } else {
      items.push({
        slug: item.slug,
        name: item.name,
        unitPrice: item.unitPrice,
        configSummary: item.configSummary || "",
        qty: item.qty || 1
      });
    }

    writeCart(items);
    onCartChanged();
  }

  function removeFromCart(index) {
    var items = readCart();
    items.splice(index, 1);
    writeCart(items);
    onCartChanged();
  }

  function updateQty(index, qty) {
    var items = readCart();
    if (!items[index]) return;

    if (qty <= 0) {
      items.splice(index, 1);
    } else {
      items[index].qty = qty;
    }

    writeCart(items);
    onCartChanged();
  }

  function getCartTotal() {
    return readCart().reduce(function (sum, item) {
      return sum + item.unitPrice * item.qty;
    }, 0);
  }

  /* { subtotal, discount, total, qualifies } — regra de brinde + 5% de
     desconto acima de R$3.000, definida em js/products.js (computeOrderTotals). */
  function getCartTotals() {
    return computeOrderTotals(getCartTotal());
  }

  function getCartCount() {
    return readCart().reduce(function (sum, item) {
      return sum + item.qty;
    }, 0);
  }

  function onCartChanged() {
    updateBadges();
    if (isOpen) {
      renderDrawerBody();
    }
  }

  /* ------------------------------------------------------------------
     Badge sync (every #cart-badge on the current page)
     ------------------------------------------------------------------ */

  function updateBadges() {
    var count = getCartCount();
    document.querySelectorAll("#cart-badge").forEach(function (badge) {
      badge.textContent = String(count);
    });
    document.querySelectorAll("#cart-toggle").forEach(function (toggle) {
      toggle.setAttribute("aria-label", "Carrinho, " + count + " " + (count === 1 ? "item" : "itens"));
    });
  }

  /* ------------------------------------------------------------------
     Drawer markup
     ------------------------------------------------------------------ */

  function buildDrawer() {
    scrimEl = document.createElement("div");
    scrimEl.className = "cart-scrim";
    scrimEl.setAttribute("aria-hidden", "true");

    drawerEl = document.createElement("aside");
    drawerEl.className = "cart-drawer";
    drawerEl.setAttribute("role", "dialog");
    drawerEl.setAttribute("aria-modal", "true");
    drawerEl.setAttribute("aria-label", "Sua lista de peças");

    drawerEl.innerHTML =
      '<div class="cart-drawer-header">' +
        '<p class="cart-drawer-title">Sua lista</p>' +
        '<button type="button" class="cart-drawer-close" aria-label="Fechar carrinho">' +
          '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">' +
            '<path d="M4 4l10 10M14 4L4 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
          '</svg>' +
        '</button>' +
      '</div>' +
      '<div class="cart-drawer-body"></div>' +
      '<div class="cart-drawer-footer"></div>';

    document.body.appendChild(scrimEl);
    document.body.appendChild(drawerEl);

    scrimEl.addEventListener("click", closeDrawer);
    drawerEl.querySelector(".cart-drawer-close").addEventListener("click", closeDrawer);
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function renderDrawerBody() {
    var items = readCart();
    var bodyContainer = drawerEl.querySelector(".cart-drawer-body");
    var footerContainer = drawerEl.querySelector(".cart-drawer-footer");

    if (items.length === 0) {
      bodyContainer.innerHTML =
        '<div class="cart-empty">' +
          '<p>Sua lista está vazia por enquanto.</p>' +
          '<a class="btn btn--ghost" href="catalogo.html">Ver catálogo</a>' +
        '</div>';
      footerContainer.innerHTML = "";
      return;
    }

    var linesHtml = items.map(function (item, index) {
      var subtotal = item.unitPrice * item.qty;
      return (
        '<div class="cart-line" data-index="' + index + '">' +
          '<div class="cart-line-info">' +
            '<p class="cart-line-name">' + escapeHtml(item.name) + '</p>' +
            (item.configSummary ? '<p class="cart-line-config">' + escapeHtml(item.configSummary) + '</p>' : '') +
            '<div class="cart-line-controls">' +
              '<div class="cart-line-qty">' +
                '<button type="button" class="cart-line-qty-btn" data-action="decrease" aria-label="Diminuir quantidade">−</button>' +
                '<span class="cart-line-qty-value">' + item.qty + '</span>' +
                '<button type="button" class="cart-line-qty-btn" data-action="increase" aria-label="Aumentar quantidade">+</button>' +
              '</div>' +
              '<span class="cart-line-price">' + formatBRL(subtotal) + '</span>' +
            '</div>' +
          '</div>' +
          '<button type="button" class="cart-line-remove" data-action="remove" aria-label="Remover ' + escapeHtml(item.name) + '">' +
            '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
              '<path d="M3 4h10M6.5 4V2.8c0-.44.36-.8.8-.8h1.4c.44 0 .8.36.8.8V4M4.5 4l.6 8.4c.04.6.55 1.1 1.15 1.1h3.5c.6 0 1.11-.5 1.15-1.1L11.5 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' +
            '</svg>' +
          '</button>' +
        '</div>'
      );
    }).join("");

    bodyContainer.innerHTML = linesHtml;

    var totals = getCartTotals();
    var discountRowsHtml = totals.qualifies
      ? '<div class="price-subtotal-row"><span>Subtotal</span><span>' + formatBRL(totals.subtotal) + '</span></div>' +
        '<div class="price-discount-row"><span>Desconto (5%)</span><span>-' + formatBRL(totals.discount) + '</span></div>'
      : '';
    var giftNoteHtml = totals.qualifies
      ? '<p class="gift-promo-note is-active">🎁 Sua compra ganhou um brinde da FuiEuQueFiz e 5% de desconto!</p>'
      : '<p class="gift-promo-note">Compras a partir de ' + formatBRL(GIFT_DISCOUNT_THRESHOLD) + ' ganham brinde da FuiEuQueFiz + 5% de desconto.</p>';

    footerContainer.innerHTML =
      discountRowsHtml +
      '<div class="cart-total-row"><span>Total</span><span>' + formatBRL(totals.total) + '</span></div>' +
      giftNoteHtml +
      '<p class="cart-microcopy">Você será redirecionado ao WhatsApp com sua lista — nossa equipe confirma disponibilidade, prazo e frete.</p>' +
      '<button type="button" class="btn btn--primary cart-checkout-btn">Finalizar pedido via WhatsApp</button>' +
      '<p class="cart-microcopy cart-microcopy--pay">Ou pague agora o valor das peças com cartão, sem sair do site — frete e prazo de produção são combinados depois pelo WhatsApp.</p>' +
      '<a href="checkout.html" class="btn btn--ghost cart-pay-btn">Pagar com cartão</a>';

    footerContainer.querySelector(".cart-checkout-btn").addEventListener("click", checkoutViaWhatsApp);

    bodyContainer.querySelectorAll(".cart-line").forEach(function (lineEl) {
      var index = parseInt(lineEl.getAttribute("data-index"), 10);

      lineEl.querySelector('[data-action="decrease"]').addEventListener("click", function () {
        var current = readCart()[index];
        if (!current) return;
        updateQty(index, current.qty - 1);
      });

      lineEl.querySelector('[data-action="increase"]').addEventListener("click", function () {
        var current = readCart()[index];
        if (!current) return;
        updateQty(index, current.qty + 1);
      });

      lineEl.querySelector('[data-action="remove"]').addEventListener("click", function () {
        removeFromCart(index);
      });
    });
  }

  function checkoutViaWhatsApp() {
    var items = readCart();
    if (items.length === 0) return;

    var lines = items.map(function (item) {
      var subtotal = item.unitPrice * item.qty;
      var configPart = item.configSummary ? " — " + item.configSummary : "";
      return item.qty + "x " + item.name + configPart + " — " + formatBRL(subtotal);
    });

    var totals = getCartTotals();
    var totalsText = totals.qualifies
      ? "\n\nSubtotal: " + formatBRL(totals.subtotal) +
        "\nDesconto (5%): -" + formatBRL(totals.discount) +
        "\nTotal: " + formatBRL(totals.total) +
        "\n\n🎁 Esse pedido dá direito a um brinde da FuiEuQueFiz!"
      : "\n\nTotal: " + formatBRL(totals.total);

    var message =
      lines.join("\n") +
      totalsText +
      "\n\nPedido feito pelo site FuiEuQueFiz. Prazo de produção e frete serão confirmados por peça.";

    // TODO: substituir 5500000000000 pelo número real do WhatsApp da loja (mesmo número usado no hero de index.html)
    var url = "https://wa.me/5500000000000?text=" + encodeURIComponent(message);
    window.open(url, "_blank", "noopener");
  }

  function clearCart() {
    writeCart([]);
    onCartChanged();
  }

  /* ------------------------------------------------------------------
     Open / close
     ------------------------------------------------------------------ */

  function openDrawer() {
    if (!drawerEl) return;
    renderDrawerBody();
    scrimEl.classList.add("is-open");
    drawerEl.classList.add("is-open");
    isOpen = true;
  }

  function closeDrawer() {
    if (!drawerEl) return;
    scrimEl.classList.remove("is-open");
    drawerEl.classList.remove("is-open");
    isOpen = false;
  }

  function toggleDrawer() {
    if (isOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }

  /* ------------------------------------------------------------------
     Init
     ------------------------------------------------------------------ */

  function init() {
    buildDrawer();
    updateBadges();

    document.querySelectorAll("#cart-toggle").forEach(function (toggle) {
      toggle.addEventListener("click", toggleDrawer);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen) {
        closeDrawer();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* Public API */
  window.addToCart = addToCart;
  window.removeFromCart = removeFromCart;
  window.updateQty = updateQty;
  window.getCartTotal = getCartTotal;
  window.Cart = {
    addToCart: addToCart,
    removeFromCart: removeFromCart,
    updateQty: updateQty,
    getCartTotal: getCartTotal,
    getCartTotals: getCartTotals,
    getCartCount: getCartCount,
    getItems: readCart, /* used by js/checkout-brick.js to know what's being paid for */
    clear: clearCart,
    open: openDrawer,
    close: closeDrawer
  };
})();
