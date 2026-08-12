/* ==========================================================================
   FuiEuQueFiz — checkout-brick.js
   Monta o Payment Brick (Checkout Transparente) do Mercado Pago dentro de
   checkout.html — o cliente preenche cartão sem sair do site. Só roda em
   checkout.html (procura #payment-brick-container; se não achar, sai).

   Fluxo:
   1. Lê o carrinho (window.Cart.getItems()), mostra resumo + total.
   2. Busca a Public Key em /api/public-config (nunca hardcoded aqui).
   3. Monta o Brick (cartão de crédito/débito, parcelamento até 12x).
   4. No onSubmit, envia o token + itens do carrinho pro backend
      (/api/create-order), que recalcula o total e cria a cobrança de
      verdade — o valor mostrado aqui é só para exibição, quem manda é o
      servidor.
   ========================================================================== */

(function () {
  "use strict";

  var container = document.getElementById("payment-brick-container");
  if (!container) return; // não estamos em checkout.html

  var emptyEl = document.getElementById("checkout-empty");
  var gridEl = document.getElementById("checkout-grid");
  var summaryLinesEl = document.getElementById("checkout-summary-lines");
  var totalEl = document.getElementById("checkout-total");
  var resultEl = document.getElementById("checkout-result");

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function showResult(kind, message) {
    if (!resultEl) return;
    resultEl.className = "checkout-result checkout-result--" + kind;
    resultEl.textContent = message;
    resultEl.hidden = false;
    resultEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  /* ------------------------------------------------------------------
     1. Carrinho — resumo + total (fonte de exibição; a fonte de verdade
        do preço é sempre recalculada no servidor em api/create-order.js)
     ------------------------------------------------------------------ */
  var items = window.Cart ? window.Cart.getItems() : [];

  if (!items || items.length === 0) {
    if (emptyEl) emptyEl.hidden = false;
    if (gridEl) gridEl.hidden = true;
    return;
  }

  var total = window.Cart.getCartTotal();

  if (summaryLinesEl) {
    summaryLinesEl.innerHTML = items.map(function (item) {
      var subtotal = item.unitPrice * item.qty;
      return (
        '<div class="checkout-summary-line">' +
          '<span>' +
            '<span class="checkout-summary-line-name">' + item.qty + 'x ' + escapeHtml(item.name) + '</span>' +
            (item.configSummary ? '<span class="checkout-summary-line-config">' + escapeHtml(item.configSummary) + '</span>' : '') +
          '</span>' +
          '<span>' + formatBRL(subtotal) + '</span>' +
        '</div>'
      );
    }).join("");
  }

  if (totalEl) totalEl.textContent = formatBRL(total);

  /* ------------------------------------------------------------------
     2 e 3. Public Key + montagem do Brick
     ------------------------------------------------------------------ */
  fetch("/api/public-config")
    .then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data && data.error ? data.error : "Não foi possível carregar o pagamento.");
        return data;
      });
    })
    .then(function (data) {
      if (!data.publicKey) throw new Error("Chave pública de pagamento ausente.");
      initBrick(data.publicKey);
    })
    .catch(function (err) {
      showResult("rejected", "Não foi possível carregar o formulário de pagamento agora. Tente novamente mais tarde ou finalize pelo WhatsApp. (" + err.message + ")");
    });

  function initBrick(publicKey) {
    if (typeof MercadoPago === "undefined") {
      showResult("rejected", "Não foi possível carregar o Mercado Pago. Verifique sua conexão e recarregue a página.");
      return;
    }

    var mp = new MercadoPago(publicKey, { locale: "pt-BR" });
    var bricksBuilder = mp.bricks();

    bricksBuilder.create("payment", "payment-brick-container", {
      initialization: {
        amount: total,
        payer: { email: "" }
      },
      customization: {
        paymentMethods: {
          creditCard: "all",
          debitCard: "all",
          minInstallments: 1,
          maxInstallments: 12
        },
        visual: {
          style: {
            theme: "default",
            customVariables: {
              /* Paleta do design system — ver css/tokens.css */
              textPrimaryColor: "#211C17",   /* --color-ink */
              baseColor: "#A6491E",          /* --color-action */
              errorColor: "#A6491E",         /* --color-action (sistema não usa vermelho) */
              successColor: "#A6491E"        /* --color-action */
            }
          }
        }
      },
      callbacks: {
        onReady: function () {
          /* Brick pronto — nada a fazer aqui, só existe pro Brick não reclamar se omitido. */
        },
        onError: function (error) {
          console.error("Payment Brick error:", error);
        },
        onSubmit: function (data) {
          var paymentType = data.paymentMethod; /* 'credit_card' | 'debit_card' */
          var formData = data.formData;

          return new Promise(function (resolve, reject) {
            var deviceId = window.MP_DEVICE_SESSION_ID || "";

            fetch("/api/create-order", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-meli-session-id": deviceId
              },
              body: JSON.stringify({
                paymentType: paymentType,
                formData: formData,
                items: items.map(function (item) {
                  return {
                    slug: item.slug,
                    qty: item.qty,
                    sizeVariantLabel: item.sizeVariantLabel || null,
                    name: item.name,
                    configSummary: item.configSummary || ""
                  };
                })
              })
            })
              .then(function (res) {
                return res.json().then(function (result) {
                  return { ok: res.ok, result: result };
                });
              })
              .then(function (payload) {
                if (!payload.ok) {
                  showResult("rejected", payload.result.message || "Não foi possível processar o pagamento.");
                  reject();
                  return;
                }

                var status = payload.result.status;
                if (status === "approved") {
                  showResult("approved", payload.result.message || "Pagamento aprovado! Você vai receber a confirmação por e-mail, e nossa equipe entra em contato pelo WhatsApp para combinar prazo e frete.");
                  if (window.Cart && window.Cart.clear) window.Cart.clear();
                } else if (status === "in_process") {
                  showResult("pending", payload.result.message || "Pagamento em análise — assim que for confirmado, avisamos você.");
                  if (window.Cart && window.Cart.clear) window.Cart.clear();
                } else {
                  showResult("rejected", payload.result.message || "Pagamento recusado.");
                }

                resolve();
              })
              .catch(function () {
                showResult("rejected", "Erro de conexão ao processar o pagamento. Tente novamente.");
                reject();
              });
          });
        }
      }
    });
  }
})();
