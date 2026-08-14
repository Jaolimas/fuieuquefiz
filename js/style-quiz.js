/* ==========================================================================
   FuiEuQueFiz — style-quiz.js
   "Qual peça combina com você?" — substitui o antigo carrossel de scroll
   travado na home por um quiz de 3 perguntas que recomenda uma peça do
   catálogo. Roda só em index.html (procura #quiz-card; se não achar, sai).

   Sem scroll-jacking, sem backend: 3 perguntas (categoria, clima/estilo,
   faixa de preço) filtram o array global PRODUCTS (js/products.js) até
   sobrar 1-2 peças. Nenhum dado é enviado a lugar nenhum — é só um filtro
   client-side sobre o catálogo que já existe.
   ========================================================================== */

(function () {
  "use strict";

  var card = document.getElementById("quiz-card");
  if (!card) return;

  var QUESTIONS = [
    {
      key: "category",
      question: "Que tipo de peça você está procurando?",
      options: [
        { label: "Uma mesa", value: "Mesas" },
        { label: "Um assento", value: "Cadeiras & Poltronas" },
        { label: "Estante ou rack", value: "Estantes & Racks" },
        { label: "Aparador ou console", value: "Aparadores" },
        { label: "Um toque de decoração", value: "Decoração" }
      ]
    },
    {
      key: "style",
      question: "Qual clima você quer no ambiente?",
      options: [
        { label: "Bruto e natural, com a textura da madeira à mostra", value: "bruto" },
        { label: "Estruturado, linhas retas e ferro em destaque", value: "estruturado" },
        { label: "Escultural, uma peça-conversa única", value: "escultural" }
      ]
    },
    {
      key: "budget",
      question: "Qual faixa de investimento faz sentido pra você?",
      options: [
        { label: "Até R$ 1.500", value: "ate-1500" },
        { label: "R$ 1.500 a R$ 3.000", value: "1500-3000" },
        { label: "Acima de R$ 3.000 — ganha brinde + 5% off", value: "acima-3000" }
      ]
    }
  ];

  var answers = {};
  var currentStep = 0;

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  /* Filtra PRODUCTS em cascata (categoria → orçamento → clima), recuando
     um filtro por vez pro pool anterior sempre que ele zera o resultado —
     assim sempre sobra pelo menos 1 peça (toda categoria tem produto). */
  function pickRecommendation() {
    var byCategory = (typeof PRODUCTS !== "undefined" ? PRODUCTS : []).filter(function (p) {
      return p.category === answers.category;
    });

    var byBudget = byCategory.filter(function (p) {
      if (answers.budget === "ate-1500") return p.price < 1500;
      if (answers.budget === "1500-3000") return p.price >= 1500 && p.price < 3000;
      return p.price >= 3000;
    });
    var budgetPool = byBudget.length > 0 ? byBudget : byCategory;

    var byStyle = budgetPool.filter(function (p) { return p.styleTag === answers.style; });
    var finalPool = (byStyle.length > 0 ? byStyle : budgetPool).slice().sort(function (a, b) {
      return a.price - b.price;
    });

    return { primary: finalPool[0], secondary: finalPool.length > 1 ? finalPool[1] : null };
  }

  function renderProgress() {
    var dots = QUESTIONS.map(function (_, i) {
      var state = i === currentStep ? " is-active" : i < currentStep ? " is-done" : "";
      return '<span class="quiz-dot' + state + '"></span>';
    }).join("");
    return '<div class="quiz-progress">' + dots + "</div>";
  }

  function renderQuestion() {
    var q = QUESTIONS[currentStep];

    var optionsHtml = q.options
      .map(function (opt) {
        return '<button type="button" class="quiz-option" data-value="' + escapeHtml(opt.value) + '">' + escapeHtml(opt.label) + "</button>";
      })
      .join("");

    card.innerHTML =
      renderProgress() +
      '<h2 class="quiz-question">' + escapeHtml(q.question) + "</h2>" +
      '<div class="quiz-options">' + optionsHtml + "</div>" +
      (currentStep > 0 ? '<button type="button" class="quiz-back">← Voltar</button>' : "");

    card.querySelectorAll(".quiz-option").forEach(function (btn) {
      btn.addEventListener("click", function () {
        answers[q.key] = btn.dataset.value;
        currentStep += 1;
        if (currentStep < QUESTIONS.length) {
          renderQuestion();
        } else {
          renderResult();
        }
      });
    });

    var backBtn = card.querySelector(".quiz-back");
    if (backBtn) {
      backBtn.addEventListener("click", function () {
        currentStep -= 1;
        renderQuestion();
      });
    }
  }

  function renderResult() {
    var rec = pickRecommendation();
    var primary = rec.primary;

    if (!primary) {
      card.innerHTML =
        '<p class="quiz-question">Não encontramos uma peça exata — mas dá uma olhada no catálogo completo.</p>' +
        '<a class="btn btn--primary" href="catalogo.html">Ver catálogo</a>';
      return;
    }

    var secondaryHtml = rec.secondary
      ? '<p class="quiz-secondary">Essa também combina: <a href="produto.html?slug=' +
        encodeURIComponent(rec.secondary.slug) +
        '">' + escapeHtml(rec.secondary.name) + " — " + formatBRL(rec.secondary.price) + "</a></p>"
      : "";

    card.innerHTML =
      '<p class="quiz-result-label">Essa é a sua peça</p>' +
      '<a class="quiz-result-photo" href="produto.html?slug=' + encodeURIComponent(primary.slug) + '">' +
        '<img src="' + primary.image + '" alt="' + escapeHtml(primary.name) + '" loading="lazy">' +
      "</a>" +
      '<h2 class="quiz-result-name">' + escapeHtml(primary.name) + "</h2>" +
      '<p class="quiz-result-price">' + formatBRL(primary.price) + "</p>" +
      '<p class="quiz-result-short">' + escapeHtml(primary.short) + "</p>" +
      '<div class="quiz-result-actions">' +
        '<a class="btn btn--primary" href="produto.html?slug=' + encodeURIComponent(primary.slug) + '">Ver peça</a>' +
        '<button type="button" class="btn btn--ghost quiz-add-btn">Adicionar à lista</button>' +
      "</div>" +
      '<p class="quiz-add-status" role="status"></p>' +
      secondaryHtml +
      '<button type="button" class="quiz-restart">Refazer o quiz</button>';

    var addBtn = card.querySelector(".quiz-add-btn");
    var statusEl = card.querySelector(".quiz-add-status");
    if (addBtn) {
      addBtn.addEventListener("click", function () {
        if (!window.Cart) return;
        window.Cart.addToCart({ slug: primary.slug, name: primary.name, unitPrice: primary.price, qty: 1 });
        if (statusEl) statusEl.textContent = "Adicionado à sua lista ✓";
        if (window.Cart.open) window.Cart.open();
      });
    }

    var restartBtn = card.querySelector(".quiz-restart");
    if (restartBtn) {
      restartBtn.addEventListener("click", function () {
        answers = {};
        currentStep = 0;
        renderQuestion();
      });
    }
  }

  renderQuestion();
})();
