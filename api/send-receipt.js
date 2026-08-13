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
   nunca reflete um valor que o navegador tenha mandado.
   ========================================================================== */

import { readFileSync } from "node:fs";
import { join } from "node:path";

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

/* Espelha computeAuthoritativeTotal() de api/create-order.js, mas também
   devolve a linha de cada item (nome, quantidade, preço unitário,
   subtotal) — o e-mail precisa do detalhamento, não só do total. */
function buildReceiptLines(items, productsMap) {
  const lines = [];
  let total = 0;

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

    const subtotal = unitPrice * qty;
    total += subtotal;

    lines.push({
      name: (item && item.name) || product.name,
      configSummary: (item && item.configSummary) || "",
      qty: qty,
      unitPrice: unitPrice,
      subtotal: subtotal
    });
  }

  return { lines, total: Math.round(total * 100) / 100 };
}

function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildReceiptHtml(lines, total) {
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

  return (
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#211C17;">' +
      '<h1 style="font-size:20px;margin-bottom:4px;">Resumo do seu pedido — FuiEuQueFiz</h1>' +
      '<p style="color:#4A4038;font-size:14px;margin-top:0;">Frete e prazo de produção são combinados por WhatsApp após a confirmação do pagamento.</p>' +
      '<table style="width:100%;border-collapse:collapse;margin-top:16px;">' +
        rows +
        '<tr>' +
          '<td style="padding:14px 0 0;font-weight:bold;">Total</td>' +
          '<td style="padding:14px 0 0;font-weight:bold;text-align:right;">' + formatBRL(total) + '</td>' +
        '</tr>' +
      '</table>' +
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

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ message: "Digite um e-mail válido." });
  }
  if (items.length === 0) {
    return res.status(400).json({ message: "Não há itens para enviar." });
  }

  let lines, total;
  try {
    const productsMap = loadProductsMap();
    ({ lines, total } = buildReceiptLines(items, productsMap));
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
        html: buildReceiptHtml(lines, total)
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
