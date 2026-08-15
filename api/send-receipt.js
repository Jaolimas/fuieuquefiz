/* ==========================================================================
   FuiEuQueFiz — /api/send-receipt
   Vercel Serverless Function (Node.js runtime). Envia por e-mail o resumo
   do pedido (peça, quantidade, valor, total) depois que o cliente digita
   o e-mail no card de confirmação pós-pagamento (checkout.html /
   js/checkout-brick.js), via API HTTP do Resend (sem SDK — mesmo padrão
   de fetch direto usado em api/create-order.js).

   Variáveis de ambiente necessárias (Vercel → Environment Variables):
     RESEND_API_KEY  — chave secreta da conta Resend (resend.com/api-keys).
     RESEND_FROM_EMAIL — opcional; remetente do e-mail (padrão:
       "FuiEuQueFiz <onboarding@resend.dev>"). Enquanto nenhum domínio
       próprio estiver verificado na conta Resend, só é possível enviar
       para o e-mail com o qual a conta Resend foi criada — depois de
       verificar um domínio (ex: fuieuquefiz.com.br), troque para algo
       como "FuiEuQueFiz <pedidos@fuieuquefiz.com.br>" e passa a
       funcionar para qualquer cliente, sem precisar mudar código.

   Segurança: assim como em create-order.js, o total e o preço de cada
   item são SEMPRE recalculados a partir de data/products.json — o e-mail
   nunca reflete um valor que o navegador tenha mandado. O frete também é
   recalculado a partir do endereço (lib/shipping.js), igual em
   create-order.js. `paymentLabel` (ex: "Cartão de crédito (Mastercard)
   em 3x") é só descritivo — não afeta o cálculo, por isso não precisa da
   mesma validação de preço.

   Todo e-mail enviado por aqui também leva uma nota de agradecimento com
   um cupom de 10% pra próxima compra (OBRIGADO10, ver buildReceiptHtml) —
   é intencional que isso só apareça pra quem digitar o e-mail pra receber
   o resumo; não tem menção a esse cupom em nenhum outro lugar do site.
   ========================================================================== */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { calculateShipping } from "../lib/shipping.js";

function loadProductsMap() {
  const raw = readFileSync(join(process.cwd(), "data", "products.json"), "utf-8");
  const parsed = JSON.parse(raw);
  const map = {};
  for (const p of parsed.products) map[p.slug] = p;
  return map;
}

function formatBRL(value) {
  return "R$ " + Math.round(value).toLocaleString("pt-BR");
}

/* Espelha computeAuthoritativeSubtotal() de api/create-order.js, mas também
   devolve a linha de cada item (nome, quantidade, preço unitário,
   subtotal) — o e-mail precisa do detalhamento, não só do total. */
function buildReceiptLines(items, productsMap) {
  const lines = [];
  let subtotal = 0;

  for (const item of items) {
    const product = productsMap[item && item.slug];
    if (!product) throw new Error("Peça não encontrada no catálogo: " + (item && item.slug));

    const qty = Math.max(1, Math.min(50, parseInt(item.qty, 10) || 1));
    let unitPrice = product.price;

    if (item.sizeVariantLabel && Array.isArray(product.sizeVariants)) {
      const variant = product.sizeVariants.find((v) => v.label === item.sizeVariantLabel);
      if (!variant) throw new Error("Variação inválida para " + item.slug + ": " + item.sizeVariantLabel);
      unitPrice += variant.priceDelta;
    }

    const lineSubtotal = unitPrice * qty;
    subtotal += lineSubtotal;

    lines.push({
      name: (item && item.name) || product.name,
      configSummary: (item && item.configSummary) || "",
      qty: qty,
      unitPrice: unitPrice,
      subtotal: lineSubtotal
    });
  }

  return { lines, subtotal: Math.round(subtotal * 100) / 100 };
}

/* ==========================================================================
   Regra de brinde + desconto: pedidos que somam R$3.000 ou mais (subtotal,
   antes do desconto) ganham um brinde da FuiEuQueFiz e 5% de desconto no
   total. Cupons dão desconto por código, sem depender do valor do pedido.
   Duplicado em js/products.js (computeOrderTotals, exibição) e em
   api/create-order.js (cobrança de verdade) — qualquer mudança aqui precisa
   ser replicada nos dois outros lugares.
   ========================================================================== */
const GIFT_DISCOUNT_THRESHOLD = 3000;
const GIFT_DISCOUNT_RATE = 0.05;

const COUPONS = {
  FAMILIAROSA: { rate: 0.05 },
  OBRIGADO10: { rate: 0.10 }
};

function findCoupon(code) {
  if (!code) return null;
  const normalized = String(code).trim().toUpperCase();
  return normalized && COUPONS[normalized] ? { code: normalized, rate: COUPONS[normalized].rate } : null;
}

function applyGiftDiscount(subtotal, couponCode) {
  const qualifies = subtotal >= GIFT_DISCOUNT_THRESHOLD;
  const coupon = findCoupon(couponCode);

  let rate = qualifies ? GIFT_DISCOUNT_RATE : 0;
  if (coupon && coupon.rate > rate) rate = coupon.rate;

  const discount = rate > 0 ? Math.round(subtotal * rate * 100) / 100 : 0;

  return {
    subtotal,
    discount,
    total: Math.round((subtotal - discount) * 100) / 100,
    qualifies
  };
}

function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildReceiptHtml(lines, totals, paymentLabel, address) {
  const rows = lines.map(function (line) {
    return (
      '<tr>' +
        '<td style="padding:10px 0;border-bottom:1px solid #E5DED4;">' +
          '<strong>' + line.qty + 'x ' + escapeHtml(line.name) + '</strong>' +
          (line.configSummary ? '<br><span style="color:#8A7F74;font-size:13px;">' + escapeHtml(line.configSummary) + '</span>' : '') +
        '</td>' +
        '<td style="padding:10px 0;border-bottom:1px solid #E5DED4;text-align:right;white-space:nowrap;">' + formatBRL(line.subtotal) + '</td>' +
      '</tr>'
    );
  }).join("");

  const discountRows = totals.qualifies
    ? '<tr>' +
        '<td style="padding:6px 0;color:#8A7F74;font-size:13px;">Subtotal</td>' +
        '<td style="padding:6px 0;text-align:right;color:#8A7F74;font-size:13px;">' + formatBRL(totals.subtotal) + '</td>' +
      '</tr>' +
      '<tr>' +
        '<td style="padding:6px 0;color:#A6491E;font-weight:bold;font-size:13px;">Desconto (5%)</td>' +
        '<td style="padding:6px 0;text-align:right;color:#A6491E;font-weight:bold;font-size:13px;">-' + formatBRL(totals.discount) + '</td>' +
      '</tr>'
    : '';

  const shippingRow =
    '<tr>' +
      '<td style="padding:6px 0;color:#8A7F74;font-size:13px;">Frete (' + totals.shippingDistanceKm + 'km de Campinas-SP)</td>' +
      '<td style="padding:6px 0;text-align:right;color:#8A7F74;font-size:13px;">' + (totals.shippingFee > 0 ? formatBRL(totals.shippingFee) : "Grátis") + '</td>' +
    '</tr>';

  const giftNote = totals.qualifies
    ? '<p style="color:#A6491E;font-weight:bold;font-size:13px;margin-top:16px;">🎁 Seu pedido ganhou um brinde da FuiEuQueFiz e 5% de desconto!</p>'
    : '';

  const addressNote = address
    ? '<p style="color:#4A4038;font-size:13px;margin-top:8px;">Entregar em: ' +
        escapeHtml(address.street) + ', ' + escapeHtml(address.number) +
        (address.complement ? ' (' + escapeHtml(address.complement) + ')' : '') +
        ' - ' + escapeHtml(address.neighborhood) + ', ' + escapeHtml(address.city) + '/' + escapeHtml(address.state) +
        ' — CEP ' + escapeHtml(address.cep) +
      '</p>'
    : '';

  /* Agradecimento + cupom de 10% pra próxima compra — só aparece aqui, no
     e-mail, nunca divulgado no site (o cliente só sabe se receber esse
     e-mail, ou seja, se ele mesmo digitou o e-mail pra receber o resumo). */
  const thankYouNote =
    '<div style="margin-top:24px;padding:16px;background:#F1ECE4;border-radius:11px;text-align:center;">' +
      '<p style="margin:0 0 6px;font-size:14px;color:#211C17;">Muito obrigado pela sua compra! 🎉</p>' +
      '<p style="margin:0;font-size:14px;color:#4A4038;">Como agradecimento, você ganhou <strong>10% de desconto</strong> na sua próxima compra na FuiEuQueFiz — é só usar o cupom <strong style="color:#A6491E;">OBRIGADO10</strong> no checkout.</p>' +
    '</div>';

  return (
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#211C17;">' +
      '<h1 style="font-size:20px;margin-bottom:4px;">Resumo do seu pedido — FuiEuQueFiz</h1>' +
      '<p style="color:#4A4038;font-size:14px;margin-top:0;">Prazo de produção é combinado por WhatsApp após a confirmação do pagamento.</p>' +
      '<table style="width:100%;border-collapse:collapse;margin-top:16px;">' +
        rows +
        discountRows +
        shippingRow +
        '<tr>' +
          '<td style="padding:14px 0 0;font-weight:bold;">Total</td>' +
          '<td style="padding:14px 0 0;font-weight:bold;text-align:right;">' + formatBRL(totals.total + totals.shippingFee) + '</td>' +
        '</tr>' +
      '</table>' +
      giftNote +
      addressNote +
      (paymentLabel ? '<p style="color:#4A4038;font-size:13px;margin-top:8px;">Forma de pagamento: ' + escapeHtml(paymentLabel) + '</p>' : '') +
      thankYouNote +
    '</div>'
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Método não permitido." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY não configurado nas variáveis de ambiente da Vercel.");
    return res.status(500).json({ message: "Envio de e-mail indisponível no momento." });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(400).json({ message: "Requisição inválida." });
  }

  const email = body && typeof body.email === "string" ? body.email.trim() : "";
  const items = Array.isArray(body && body.items) ? body.items : [];
  /* Só descritivo (ex: "Cartão de crédito (Mastercard) em 3x") — o valor
     cobrado já foi validado à parte, em create-order.js. Trunca porque
     esse endpoint é público; nada além de escapeHtml() confia nesse texto. */
  const paymentLabel = body && typeof body.paymentLabel === "string" ? body.paymentLabel.trim().slice(0, 80) : "";
  const couponCode = body && typeof body.couponCode === "string" ? body.couponCode : null;
  const address = body && typeof body.address === "object" ? body.address : null;

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ message: "Digite um e-mail válido." });
  }
  if (items.length === 0) {
    return res.status(400).json({ message: "Não há itens para enviar." });
  }

  const shipping = await calculateShipping(address);
  if (!shipping.ok) {
    return res.status(400).json({ message: shipping.message });
  }

  let lines, totals;
  try {
    const productsMap = loadProductsMap();
    const built = buildReceiptLines(items, productsMap);
    lines = built.lines;
    const discountTotals = applyGiftDiscount(built.subtotal, couponCode);
    /* totals.total fica só com o valor das peças (subtotal - desconto) —
       o frete é somado à parte na exibição (buildReceiptHtml soma os
       dois na linha "Total"), igual em api/create-order.js. */
    totals = {
      ...discountTotals,
      shippingFee: shipping.fee,
      shippingDistanceKm: shipping.distanceKm
    };
  } catch (err) {
    return res.status(400).json({ message: "Não foi possível validar os itens do pedido: " + err.message });
  }

  const from = process.env.RESEND_FROM_EMAIL || "FuiEuQueFiz <onboarding@resend.dev>";

  try {
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey
      },
      body: JSON.stringify({
        from: from,
        to: [email],
        subject: "Seu pedido FuiEuQueFiz",
        html: buildReceiptHtml(lines, totals, paymentLabel, address)
      })
    });

    const data = await resendRes.json();

    if (!resendRes.ok) {
      /* JSON.stringify, não objeto aninhado — mesma lição de create-order.js:
         a Vercel trunca objetos aninhados no log em profundidade 2. */
      console.error("Resend API error: status=" + resendRes.status + " body=" + JSON.stringify(data));
      return res.status(502).json({ message: "Não foi possível enviar o e-mail agora. Tente novamente em instantes." });
    }

    console.log("Recibo enviado por e-mail:", { resendId: data.id });
    return res.status(200).json({ message: "E-mail enviado! Confira sua caixa de entrada." });
  } catch (err) {
    console.error("Falha ao chamar a API do Resend:", err.message);
    return res.status(500).json({ message: "Erro interno ao enviar o e-mail." });
  }
}
