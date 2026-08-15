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
      quantidade, valor, total — já incluindo o desconto de brinde, se o
      pedido tiver atingido R$3.000, usando o total que o servidor devolveu
      em payload.result.totals) e um formulário pra receber esse resumo
      por e-mail — ao enviar, chama /api/send-receipt (Resend), que
      recalcula os valores a partir de data/products.json antes de
      montar o e-mail (e sempre inclui uma nota de agradecimento com
      cupom de 10% pra próxima compra, nunca divulgado no site).
   7. Cupom de desconto (nunca divulgado no site): aplicar recalcula o
      total (computeOrderTotals, js/products.js) e remonta o Payment
      Brick com o novo valor — o código vai junto no POST pra
      /api/create-order e /api/send-receipt, mas quem decide de verdade
      se o cupom vale (e por quanto) é sempre o servidor.
   8. Endereço de entrega obrigatório (js/checkout-address.js): o Brick só
      é montado depois que o cliente confirma um endereço com frete
      calculável (evento "checkout:address-confirmed"). O frete somado ao
      total é só prévia — api/create-order.js recalcula tudo de novo a
      partir do endereço antes de cobrar.
   ========================================================================== */

(function () {
  "use strict";

  var container = document.getElementById("payment-brick-container");
  if (!container) return; // não estamos em checkout.html

  var emptyEl = document.getElementById("checkout-empty");
  var addressSectionEl = document.getElementById("checkout-address-section");
  var gridEl = document.getElementById("checkout-grid");
  var summaryLinesEl = document.getElementById("checkout-summary-lines");
  var subtotalRowEl = document.getElementById("checkout-subtotal-row");
  var subtotalEl = document.getElementById("checkout-subtotal");
  var discountRowEl = document.getElementById("checkout-discount-row");
  var discountEl = document.getElementById("checkout-discount");
  var discountLabelEl = document.getElementById("checkout-discount-label");
  var shippingRowEl = document.getElementById("checkout-shipping-row");
  var shippingEl = document.getElementById("checkout-shipping");
  var shippingLabelEl = document.getElementById("checkout-shipping-label");
  var totalEl = document.getElementById("checkout-total");
  var giftNoteEl = document.getElementById("checkout-gift-note");
  var couponInputEl = document.getElementById("checkout-coupon-input");
  var couponApplyBtn = document.getElementById("checkout-coupon-apply");
  var couponStatusEl = document.getElementById("checkout-coupon-status");
  var resultEl = document.getElementById("checkout-result");
  var pixEl = document.getElementById("checkout-pix");
  var pixQrEl = document.getElementById("checkout-pix-qr");
  var pixCodeEl = document.getElementById("checkout-pix-code");
  var pixCopyBtn = document.getElementById("checkout-pix-copy");
  var receiptEl = document.getElementById("checkout-receipt");
  var receiptLinesEl = document.getElementById("checkout-receipt-lines");
  var receiptSubtotalRowEl = document.getElementById("checkout-receipt-subtotal-row");
  var receiptSubtotalEl = document.getElementById("checkout-receipt-subtotal");
  var receiptDiscountRowEl = document.getElementById("checkout-receipt-discount-row");
  var receiptDiscountEl = document.getElementById("checkout-receipt-discount");
  var receiptDiscountLabelEl = document.getElementById("checkout-receipt-discount-label");
  var receiptShippingRowEl = document.getElementById("checkout-receipt-shipping-row");
  var receiptShippingEl = document.getElementById("checkout-receipt-shipping");
  var receiptShippingLabelEl = document.getElementById("checkout-receipt-shipping-label");
  var receiptTotalEl = document.getElementById("checkout-receipt-total");
  var receiptGiftNoteEl = document.getElementById("checkout-receipt-gift-note");
  var receiptAddressEl = document.getElementById("checkout-receipt-address");
  var receiptPaymentEl = document.getElementById("checkout-receipt-payment");
  var receiptForm = document.getElementById("checkout-receipt-form");
  var receiptEmailInput = document.getElementById("checkout-receipt-email");
  var receiptSendBtn = document.getElementById("checkout-receipt-send-btn");
  var receiptStatusEl = document.getElementById("checkout-receipt-status");

  var currentPaymentLabel = ""; /* preenchido por showReceipt(), lido no envio do e-mail */
  var appliedCouponCode = null; /* cupom validado (client-side, só pra exibição) — a validação de verdade é sempre em api/create-order.js */
  var addressConfirmed = false; /* só true depois do evento "checkout:address-confirmed" (js/checkout-address.js) */
  var confirmedAddress = null;
  var shippingFee = 0; /* prévia client-side — api/create-order.js recalcula a partir do endereço antes de cobrar */
  var shippingDistanceKm = null;

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

  /* Preenche subtotal/desconto/frete/total + nota de brinde a partir de um
     objeto { subtotal, discount, total, qualifies } (ver computeOrderTotals
     em js/products.js) + o frete calculado à parte (fee/distanceKm, ver
     js/checkout-address.js). mode "promo" (resumo, antes de pagar) sempre
     mostra a nota, convidando o cliente a atingir o valor mínimo; mode
     "confirm" (card de recibo, depois de pagar) só mostra quando já
     qualificou. */
  function applyTotalsToDom(totals, els, mode, fee, distanceKm) {
    var shippingFeeValue = fee || 0;
    var grandTotal = totals.total + shippingFeeValue;
    if (els.totalEl) els.totalEl.textContent = formatBRL(grandTotal);

    /* Mostra a linha de subtotal/desconto sempre que houve desconto —
       antes só dependia de "qualifies" (bateu R$3.000), mas agora um
       cupom pode dar desconto sem bater o valor mínimo. */
    var hasDiscount = totals.discount > 0;
    if (els.subtotalRowEl) els.subtotalRowEl.hidden = !hasDiscount;
    if (els.subtotalEl) els.subtotalEl.textContent = formatBRL(totals.subtotal);

    if (els.discountRowEl) els.discountRowEl.hidden = !hasDiscount;
    if (els.discountEl) els.discountEl.textContent = "-" + formatBRL(totals.discount);
    if (els.discountLabelEl && hasDiscount) {
      var pct = Math.round((totals.discount / totals.subtotal) * 100);
      els.discountLabelEl.textContent = "Desconto (" + pct + "%)";
    }

    if (els.shippingRowEl) els.shippingRowEl.hidden = distanceKm == null;
    if (els.shippingEl) els.shippingEl.textContent = shippingFeeValue > 0 ? formatBRL(shippingFeeValue) : "Grátis";
    if (els.shippingLabelEl && distanceKm != null) {
      els.shippingLabelEl.textContent = "Frete (" + distanceKm + "km de Campinas-SP)";
    }

    if (els.giftNoteEl) {
      if (totals.qualifies) {
        els.giftNoteEl.textContent = "🎁 Seu pedido ganhou um brinde da FuiEuQueFiz e 5% de desconto!";
        els.giftNoteEl.classList.add("is-active");
        els.giftNoteEl.hidden = false;
      } else if (totals.couponApplied) {
        els.giftNoteEl.textContent = "✓ Cupom aplicado!";
        els.giftNoteEl.classList.add("is-active");
        els.giftNoteEl.hidden = false;
      } else if (mode === "promo") {
        els.giftNoteEl.textContent = "Compras a partir de " + formatBRL(GIFT_DISCOUNT_THRESHOLD) + " ganham brinde da FuiEuQueFiz + 5% de desconto.";
        els.giftNoteEl.classList.remove("is-active");
        els.giftNoteEl.hidden = false;
      } else {
        els.giftNoteEl.hidden = true;
      }
    }
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
    if (addressSectionEl) addressSectionEl.hidden = true;
    if (gridEl) gridEl.hidden = true;
    return;
  }

  if (addressSectionEl) addressSectionEl.hidden = false;

  var totals = window.Cart.getCartTotals();
  var total = totals.total; /* usado como valor inicial do Brick (parcelamento) — somado ao frete assim que o endereço for confirmado; o servidor recalcula tudo ao criar a order */

  if (summaryLinesEl) summaryLinesEl.innerHTML = summaryLinesHtml(items);
  applyTotalsToDom(totals, {
    totalEl: totalEl,
    subtotalRowEl: subtotalRowEl,
    subtotalEl: subtotalEl,
    discountRowEl: discountRowEl,
    discountEl: discountEl,
    discountLabelEl: discountLabelEl,
    shippingRowEl: shippingRowEl,
    shippingEl: shippingEl,
    shippingLabelEl: shippingLabelEl,
    giftNoteEl: giftNoteEl
  }, "promo", shippingFee, shippingDistanceKm);

  /* ------------------------------------------------------------------
     Cupom de desconto — nunca divulgado no site (o cliente só descobre
     um código por fora, ex: no e-mail de agradecimento pós-compra). A
     validação aqui é só pra atualizar a exibição e reenquadrar o Brick
     com o valor certo antes de pagar; api/create-order.js sempre revalida
     o código e recalcula o total de novo no servidor, então não tem como
     um cupom inventado no navegador render desconto de verdade.
     ------------------------------------------------------------------ */
  function recomputeTotals() {
    totals = computeOrderTotals(window.Cart.getCartTotal(), appliedCouponCode);
    total = totals.total + shippingFee;

    applyTotalsToDom(totals, {
      totalEl: totalEl,
      subtotalRowEl: subtotalRowEl,
      subtotalEl: subtotalEl,
      discountRowEl: discountRowEl,
      discountEl: discountEl,
      discountLabelEl: discountLabelEl,
      shippingRowEl: shippingRowEl,
      shippingEl: shippingEl,
      shippingLabelEl: shippingLabelEl,
      giftNoteEl: giftNoteEl
    }, "promo", shippingFee, shippingDistanceKm);

    remountBrickWithCurrentTotal();
  }

  /* ------------------------------------------------------------------
     Endereço de entrega obrigatório (js/checkout-address.js) — o Brick só
     é revelado/montado depois desse evento. Frete somado ao total aqui é
     só prévia; api/create-order.js recalcula tudo de novo a partir do
     mesmo endereço antes de cobrar.
     ------------------------------------------------------------------ */
  document.addEventListener("checkout:address-confirmed", function (e) {
    confirmedAddress = e.detail.address;
    shippingFee = e.detail.fee;
    shippingDistanceKm = e.detail.distanceKm;
    addressConfirmed = true;

    if (gridEl) gridEl.hidden = false;
    recomputeTotals();
    gridEl.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  if (couponApplyBtn) {
    couponApplyBtn.addEventListener("click", function () {
      var raw = couponInputEl ? couponInputEl.value.trim() : "";

      if (!raw) {
        appliedCouponCode = null;
        if (couponStatusEl) {
          couponStatusEl.className = "checkout-coupon-status";
          couponStatusEl.textContent = "";
        }
        recomputeTotals();
        return;
      }

      var candidateTotals = computeOrderTotals(window.Cart.getCartTotal(), raw);

      if (!candidateTotals.couponApplied) {
        appliedCouponCode = null;
        if (couponStatusEl) {
          couponStatusEl.className = "checkout-coupon-status checkout-coupon-status--error";
          couponStatusEl.textContent = "Cupom inválido.";
        }
        recomputeTotals();
        return;
      }

      appliedCouponCode = raw;
      if (couponStatusEl) {
        var pct = Math.round(candidateTotals.discount > 0 ? (candidateTotals.discount / candidateTotals.subtotal) * 100 : 0);
        couponStatusEl.className = "checkout-coupon-status checkout-coupon-status--success";
        couponStatusEl.textContent = "Cupom aplicado — " + pct + "% de desconto!";
      }
      recomputeTotals();
    });
  }

  /* ------------------------------------------------------------------
     Card de confirmação pós-pagamento — resumo do pedido + opção de
     receber por e-mail (chamado depois que a order é criada com
     sucesso, aprovada na hora ou Pix aguardando pagamento).
     ------------------------------------------------------------------ */
  function showReceipt(paymentLabel, orderTotals) {
    if (!receiptEl) return;
    currentPaymentLabel = paymentLabel || "";
    if (receiptLinesEl) receiptLinesEl.innerHTML = summaryLinesHtml(items);

    var resolvedTotals = orderTotals || totals;
    var fee = resolvedTotals.shippingFee != null ? resolvedTotals.shippingFee : shippingFee;
    var km = resolvedTotals.shippingDistanceKm != null ? resolvedTotals.shippingDistanceKm : shippingDistanceKm;

    applyTotalsToDom(resolvedTotals, {
      totalEl: receiptTotalEl,
      subtotalRowEl: receiptSubtotalRowEl,
      subtotalEl: receiptSubtotalEl,
      discountRowEl: receiptDiscountRowEl,
      discountEl: receiptDiscountEl,
      discountLabelEl: receiptDiscountLabelEl,
      shippingRowEl: receiptShippingRowEl,
      shippingEl: receiptShippingEl,
      shippingLabelEl: receiptShippingLabelEl,
      giftNoteEl: receiptGiftNoteEl
    }, "confirm", fee, km);
    if (receiptPaymentEl) receiptPaymentEl.textContent = currentPaymentLabel;
    if (receiptAddressEl && confirmedAddress) {
      var a = confirmedAddress;
      receiptAddressEl.textContent = "Entregar em: " + a.street + ", " + a.number +
        (a.complement ? " (" + a.complement + ")" : "") +
        " - " + a.neighborhood + ", " + a.city + "/" + a.state + " — CEP " + a.cep;
    }
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
          couponCode: appliedCouponCode,
          address: confirmedAddress,
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

     bricksBuilder/brickController ficam no escopo do módulo porque o
     Brick precisa ser remontado (unmount + create de novo) sempre que o
     total mudar depois de já montado — hoje só acontece ao aplicar um
     cupom, já que o valor de "initialization.amount" não é algo que dá
     pra atualizar num Brick já montado.
     ------------------------------------------------------------------ */
  var bricksBuilder = null;
  var brickController = null;

  fetch("/api/public-config")
    .then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data && data.error ? data.error : "Não foi possível carregar o pagamento.");
        return data;
      });
    })
    .then(function (data) {
      if (!data.publicKey) throw new Error("Chave pública de pagamento ausente.");
      if (typeof MercadoPago === "undefined") throw new Error("Não foi possível carregar o Mercado Pago. Verifique sua conexão e recarregue a página.");

      var mp = new MercadoPago(data.publicKey, { locale: "pt-BR" });
      bricksBuilder = mp.bricks();
      if (addressConfirmed) mountBrick(); /* endereço já confirmado antes da public key carregar (raro, mas possível) */
    })
    .catch(function (err) {
      showResult("rejected", "Não foi possível carregar o formulário de pagamento agora. Tente novamente mais tarde ou finalize pelo WhatsApp. (" + err.message + ")");
    });

  /* Chamada na montagem inicial (após confirmar o endereço) e de novo
     sempre que o total mudar (cupom aplicado/removido) depois que o Brick
     já estava na tela. */
  function remountBrickWithCurrentTotal() {
    if (!bricksBuilder || !addressConfirmed) return; /* Brick ainda não pode montar — falta a public key ou o endereço confirmado */
    mountBrick();
  }

  function mountBrick() {
    if (brickController && typeof brickController.unmount === "function") {
      brickController.unmount();
    }

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

          /* Segurança extra — o Brick só é montado depois do endereço
             confirmado, mas se de alguma forma chegar aqui sem endereço,
             não deixa cobrar sem saber pra onde entregar. */
          if (!addressConfirmed || !confirmedAddress) {
            showResult("rejected", "Preencha o endereço de entrega antes de pagar.");
            return Promise.reject();
          }

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
                couponCode: appliedCouponCode,
                address: confirmedAddress,
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
                  showResult("approved", payload.result.message || "Pagamento aprovado! Nossa equipe entra em contato pelo WhatsApp para combinar o prazo de produção.");
                  showReceipt(paymentLabel, payload.result.totals);
                  if (window.Cart && window.Cart.clear) window.Cart.clear();
                } else if (status === "in_process") {
                  showResult("pending", payload.result.message || "Pagamento em análise — assim que for confirmado, avisamos você.");
                  if (payload.result.pix) showPix(payload.result.pix);
                  showReceipt(paymentLabel, payload.result.totals);
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
    }).then(function (controller) {
      brickController = controller;
    });
  }
})();
