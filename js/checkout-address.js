/* ==========================================================================
   FuiEuQueFiz — checkout-address.js
   Endereço de entrega obrigatório no checkout (checkout.html), antes de
   mostrar o resumo/Payment Brick. Só roda em checkout.html (procura
   #checkout-address-form; se não achar, sai).

   Fluxo:
   1. CEP preenchido (8 dígitos) → autocompleta rua/bairro/cidade/UF via
      ViaCEP (gratuito, sem chave) — o cliente ainda pode editar tudo.
   2. Ao enviar o formulário, chama /api/shipping com o endereço completo
      pra calcular o frete (lib/shipping.js — grátis até 80km de
      Campinas-SP, +R$50 até 100km, recusado acima disso).
   3. Se deu certo, dispara o evento "checkout:address-confirmed" (com
      { address, fee, distanceKm } em e.detail) — js/checkout-brick.js
      escuta esse evento pra revelar o resumo/Payment Brick e somar o
      frete ao total. O valor mostrado aqui é só prévia: quem decide de
      verdade (e recalcula) é sempre o servidor, de novo, em
      api/create-order.js, a partir do mesmo endereço.
   ========================================================================== */

(function () {
  "use strict";

  var form = document.getElementById("checkout-address-form");
  if (!form) return; // não estamos em checkout.html

  var cepInput = document.getElementById("addr-cep");
  var streetInput = document.getElementById("addr-street");
  var numberInput = document.getElementById("addr-number");
  var complementInput = document.getElementById("addr-complement");
  var neighborhoodInput = document.getElementById("addr-neighborhood");
  var cityInput = document.getElementById("addr-city");
  var stateInput = document.getElementById("addr-state");
  var confirmBtn = document.getElementById("addr-confirm-btn");
  var statusEl = document.getElementById("checkout-address-status");

  function onlyDigits(str) {
    return String(str || "").replace(/\D/g, "");
  }

  function setStatus(kind, message) {
    if (!statusEl) return;
    statusEl.className = "checkout-address-status" + (kind ? " checkout-address-status--" + kind : "");
    statusEl.textContent = message || "";
  }

  /* Autocompleta rua/bairro/cidade/UF a partir do CEP — o cliente ainda
     pode corrigir qualquer campo manualmente antes de enviar. */
  if (cepInput) {
    cepInput.addEventListener("blur", function () {
      var cep = onlyDigits(cepInput.value);
      if (cep.length !== 8) return;

      fetch("https://viacep.com.br/ws/" + cep + "/json/")
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (!data || data.erro) return;
          if (streetInput && !streetInput.value) streetInput.value = data.logradouro || "";
          if (neighborhoodInput && !neighborhoodInput.value) neighborhoodInput.value = data.bairro || "";
          if (cityInput && !cityInput.value) cityInput.value = data.localidade || "";
          if (stateInput && !stateInput.value) stateInput.value = data.uf || "";
        })
        .catch(function () { /* autofill é só conveniência — falha silenciosa, cliente preenche na mão */ });
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var address = {
      cep: cepInput ? cepInput.value.trim() : "",
      street: streetInput ? streetInput.value.trim() : "",
      number: numberInput ? numberInput.value.trim() : "",
      complement: complementInput ? complementInput.value.trim() : "",
      neighborhood: neighborhoodInput ? neighborhoodInput.value.trim() : "",
      city: cityInput ? cityInput.value.trim() : "",
      state: stateInput ? stateInput.value.trim().toUpperCase() : ""
    };

    var originalBtnText = confirmBtn ? confirmBtn.textContent : "";
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.textContent = "Calculando frete...";
    }
    setStatus("", "");

    fetch("/api/shipping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: address })
    })
      .then(function (res) {
        return res.json().then(function (result) { return { ok: res.ok, result: result }; });
      })
      .then(function (payload) {
        if (confirmBtn) {
          confirmBtn.disabled = false;
          confirmBtn.textContent = originalBtnText;
        }

        if (!payload.ok || !payload.result.ok) {
          setStatus("error", (payload.result && payload.result.message) || "Não foi possível calcular o frete para esse endereço.");
          return;
        }

        var fee = payload.result.fee;
        var distanceKm = payload.result.distanceKm;
        setStatus("success", fee > 0
          ? "Frete: R$ " + fee + " (você está a ~" + distanceKm + "km de Campinas-SP)"
          : "Frete grátis! (você está a ~" + distanceKm + "km de Campinas-SP)");

        document.dispatchEvent(new CustomEvent("checkout:address-confirmed", {
          detail: { address: address, fee: fee, distanceKm: distanceKm }
        }));
      })
      .catch(function () {
        if (confirmBtn) {
          confirmBtn.disabled = false;
          confirmBtn.textContent = originalBtnText;
        }
        setStatus("error", "Erro de conexão. Tente novamente.");
      });
  });
})();
