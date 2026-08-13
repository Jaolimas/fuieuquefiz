/* ==========================================================================
   FuiEuQueFiz — checkout-brick.js
   Monta o Payment Brick (Checkout Transparente) do Mercado Pago dentro de
   checkout.html — o cliente paga com cartão ou Pix sem sair do site. Só
   roda em checkout.html (procura #payment-brick-container; se não achar,
   sai).

   Fluxo:
   1. Lê o carrinho (window.Cart.getItems()), mostra resumo + total.
   2. Busca a Public Key em /api/public-config (nunca hardcoded aqui).
   3. Monta o Brick (cartão de crédito/débito com parcelamento até 12x, e
      Pix via customization.paymentMethods.bankTransfer).
   4. No onSubmit, envia o token (cartão) ou só o payment_method_id "pix"
      + itens do carrinho pro backend (/api/create-order), que recalcula
      o total e cria a cobrança de verdade — o valor mostrado aqui é só
      para exibição, quem manda é o servidor.
   5. Cartão aprova na hora (status "approved"). Pix não — o backend
      devolve status "in_process" + os dados do QR Code/copia-e-cola
      (payload.result.pix), exibidos por showPix(); a confirmação real do
      pagamento chega depois, de forma assíncrona, via api/webhook.js.
   6. Nos dois casos de sucesso (aprovado ou Pix pendente), showReceipt()
      exibe o card #checkout-receipt com o resumo do pedido (peça,
      quantidade, valor, total) e um formulário pra receber esse resumo
      por e-mail — ao enviar, chama /api/send-receipt (Resend), que
      recalcula os valores a partir de data/products.json antes de
      montar o e-mail.
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
  var pixEl = document.getElementById("checkout-pix");
  var pixQrEl = document.getElementById("checkout-pix-qr");
  var pixCodeEl = document.getElementById("checkout-pix-code");
  var pixCopyBtn = document.getElementById("checkout-pix-copy");
  var receiptEl = document.getElementById("checkout-receipt");
  var receiptLinesEl = document.getElementById("checkout-receipt-lines");
  var receiptTotalEl = document.getElementById("checkout-receipt-total");
  var receiptPaymentEl = document.getElementById("checkout-receipt-payment");
  var receiptForm = document.getElementById("checkout-receipt-form");
  var receiptEmailInput = document.getElementById("checkout-receipt-email");
  var receiptSendBtn = document.getElementById("checkout-receipt-send-btn");
  var receiptStatusEl = document.getElementById("checkout-receipt-status");

  var currentPaymentLabel = ""; /* preenchido por showReceipt(), lido no envio do e-mail */

  var CARD_BRAND_LABELS = {
    visa: "Visa",
    master: "Mastercard",
    amex: "American Express",
    elo: "Elo",
    hipercard: "Hipercard",
    diners: "Diners Club",
    discover: "Discover",
    naranja: "Naranja",
    cabal: "Cabal"
  };

  /* Monta "Cartão de crédito (Mastercard) em 3x" / "Cartão de débito (Visa)"
     / "Pix" a partir do que o Brick devolveu no onSubmit — só descritivo
     (o valor cobrado de verdade já foi validado à parte, no servidor). */
  function paymentMethodLabel(paymentType, formData) {
    if (paymentType === "bank_transfer") return "Pix";

    var brandId = formData && formData.payment_method_id;
    var brand = CARD_BRAND_LABELS[brandId] || brandId || "";
    var kind = paymentType === "debit_card" ? "Cartão de débito" : "Cartão de crédito";
    var label = kind + (brand ? " (" + brand + ")" : "");

    var installments = formData && parseInt(formData.installments, 10);
    if (paymentType === "credit_card" && installments > 1) {
      label += " em " + installments + "x";
    }

    return label;
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function summaryLinesHtml(list) {
    return list.map(function (item) {
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

  function showResult(kind, message) {
    if (!resultEl) return;
    resultEl.className = "checkout-result checkout-result--" + kind;
    resultEl.textContent = message;
    resultEl.hidden = false;
    resultEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  /* Mostra o QR Code + código copia-e-cola do Pix (chamado além de
     showResult — o Pix não aprova na hora, então o cliente precisa dessas
     informações pra concluir o pagamento pelo app do banco). */
  function showPix(pix) {
    if (!pixEl || !pix || !pix.qrCode) return;

    if (pixQrEl && pix.qrCodeBase64) {
      pixQrEl.src = "data:image/png;base64," + pix.qrCodeBase64;
    }
    if (pixCodeEl) pixCodeEl.textContent = pix.qrCode;

    pixEl.hidden = false;
    pixEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  if (pixCopyBtn) {
    pixCopyBtn.addEventListener("click", function () {
      if (!pixCodeEl || !pixCodeEl.textContent) return;
      navigator.clipboard.writeText(pixCodeEl.textContent).then(function () {
        var originalText = "Copiar código";
        pixCopyBtn.textContent = "Copiado ✓";
        window.setTimeout(function () { pixCopyBtn.textContent = originalText; }, 1500);
      });
    });
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

  if (summaryLinesEl) summaryLinesEl.innerHTML = summaryLinesHtml(items);
  if (totalEl) totalEl.textContent = formatBRL(total);

  /* ------------------------------------------------------------------
     Card de confirmação pós-pagamento — resumo do pedido + opção de
     receber por e-mail (chamado depois que a order é criada com
     sucesso, aprovada na hora ou Pix aguardando pagamento).
     ------------------------------------------------------------------ */
  function showReceipt(paymentLabel) {
    if (!receiptEl) return;
    currentPaymentLabel = paymentLabel || "";
    if (receiptLinesEl) receiptLinesEl.innerHTML = summaryLinesHtml(items);
    if (receiptTotalEl) receiptTotalEl.textContent = formatBRL(total);
    if (receiptPaymentEl) receiptPaymentEl.textContent = currentPaymentLabel;
    receiptEl.hidden = false;
  }

  if (receiptForm) {
    receiptForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!receiptEmailInput || !receiptEmailInput.value.trim()) return;

      var email = receiptEmailInput.value.trim();
      var originalBtnText = receiptSendBtn ? receiptSendBtn.textContent : "";

      if (receiptSendBtn) {
        receiptSendBtn.disabled = true;
        receiptSendBtn.textContent = "Enviando...";
      }
      if (receiptStatusEl) {
        receiptStatusEl.className = "checkout-receipt-status";
        receiptStatusEl.textContent = "";
      }

      fetch("/api/send-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          paymentLabel: currentPaymentLabel,
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
          return res.json().then(function (result) { return { ok: res.ok, result: result }; });
        })
        .then(function (payload) {
          if (receiptSendBtn) {
            receiptSendBtn.disabled = false;
            receiptSendBtn.textContent = originalBtnText;
          }
          if (receiptStatusEl) {
            receiptStatusEl.className = "checkout-receipt-status" + (payload.ok ? "" : " checkout-receipt-status--error");
            receiptStatusEl.textContent = payload.result.message || (payload.ok ? "E-mail enviado!" : "Não foi possível enviar o e-mail.");
          }
        })
        .catch(function () {
          if (receiptSendBtn) {
            receiptSendBtn.disabled = false;
            receiptSendBtn.textContent = originalBtnText;
          }
          if (receiptStatusEl) {
            receiptStatusEl.className = "checkout-receipt-status checkout-receipt-status--error";
            receiptStatusEl.textContent = "Erro de conexão. Tente novamente.";
          }
        });
    });
  }

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
          bankTransfer: "all", /* Pix */
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
          var paymentType = data.paymentMethod; /* 'credit_card' | 'debit_card' | 'bank_transfer' (Pix) */
          var formData = data.formData;

          if (pixEl) pixEl.hidden = true; /* limpa QR de uma tentativa anterior, se houver */

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
                var paymentLabel = paymentMethodLabel(paymentType, formData);
                if (status === "approved") {
                  showResult("approved", payload.result.message || "Pagamento aprovado! Nossa equipe entra em contato pelo WhatsApp para combinar prazo e frete.");
                  showReceipt(paymentLabel);
                  if (window.Cart && window.Cart.clear) window.Cart.clear();
                } else if (status === "in_process") {
                  showResult("pending", payload.result.message || "Pagamento em análise — assim que for confirmado, avisamos você.");
                  if (payload.result.pix) showPix(payload.result.pix);
                  showReceipt(paymentLabel);
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
