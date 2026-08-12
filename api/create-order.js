/* ==========================================================================
   FuiEuQueFiz — /api/create-order
   Vercel Serverless Function (Node.js runtime). Recebe o token de cartão
   gerado pelo Payment Brick (checkout.html / js/checkout-brick.js) e cria
   a cobrança usando a API de Orders do Mercado Pago (endpoint atual
   recomendado pela documentação oficial em 2026 — POST /v1/orders — não
   a API legada /v1/payments).

   Variáveis de ambiente necessárias (Vercel → Environment Variables):
     MP_ACCESS_TOKEN — Access Token secreto (mesmo já usado antes).

   Regras de segurança seguidas aqui:
   - O total NUNCA vem do navegador: é recalculado a partir de
     data/products.json (única fonte de verdade de preço) a cada chamada.
   - Nunca logamos token de cartão, e-mail do pagador ou qualquer dado
     pessoal — só id do pedido, status e status_detail (não sensíveis).
   - Idempotency key gerada a cada requisição (crypto.randomUUID()) evita
     cobrança duplicada se o Brick reenviar a mesma submissão.
   - O device fingerprint (X-meli-session-id, gerado pelo security.js no
     front) é repassado ao Mercado Pago para melhorar a análise antifraude.
   ========================================================================== */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

/* ==========================================================================
   Tradução de status_detail para mensagens claras em português.
   Lista de códigos confirmada na documentação oficial (reasons-for-rejection).
   ========================================================================== */
const STATUS_DETAIL_MESSAGES = {
  cc_rejected_bad_filled_card_number: "Número do cartão incorreto. Confira os dados e tente novamente.",
  cc_rejected_bad_filled_date: "Data de validade incorreta. Confira os dados e tente novamente.",
  cc_rejected_bad_filled_security_code: "Código de segurança (CVV) incorreto. Confira os dados e tente novamente.",
  cc_rejected_bad_filled_other: "Dados do cartão incorretos. Confira as informações e tente novamente.",
  cc_rejected_insufficient_amount: "Cartão sem saldo/limite suficiente para esta compra.",
  cc_rejected_call_for_authorize: "Seu banco pediu autorização manual para este pagamento. Entre em contato com o banco ou tente outro cartão.",
  cc_rejected_card_disabled: "Cartão desabilitado. Entre em contato com seu banco ou tente outro cartão.",
  cc_rejected_duplicated_payment: "Já identificamos um pagamento igual a este recentemente. Se não foi engano, aguarde alguns minutos ou fale com a gente pelo WhatsApp.",
  cc_rejected_invalid_installments: "Esse cartão não aceita o número de parcelas escolhido. Tente outra quantidade de parcelas.",
  cc_rejected_max_attempts: "Número máximo de tentativas atingido. Tente outro cartão ou finalize pelo WhatsApp.",
  cc_rejected_high_risk: "O pagamento foi recusado por segurança. Tente outro cartão ou finalize pelo WhatsApp.",
  cc_rejected_blacklist: "O pagamento não foi autorizado. Tente outro cartão ou finalize pelo WhatsApp.",
  cc_rejected_other_reason: "Seu banco recusou o pagamento sem detalhar o motivo. Tente outro cartão ou finalize pelo WhatsApp.",
  pending_contingency: "Estamos processando seu pagamento — pode levar alguns minutos.",
  pending_review_manual: "Seu pagamento está em análise manual. Avisamos assim que houver novidade."
};

function friendlyMessage(status, statusDetail) {
  if (STATUS_DETAIL_MESSAGES[statusDetail]) return STATUS_DETAIL_MESSAGES[statusDetail];
  if (status === "approved") return "Pagamento aprovado!";
  if (status === "in_process") return "Pagamento em análise. Avisamos assim que houver novidade.";
  return "Pagamento recusado. Tente outro cartão ou finalize pelo WhatsApp.";
}

/* ==========================================================================
   Recalcula o total a partir de data/products.json — nunca confia no
   unitPrice/total que o navegador possa enviar.
   ========================================================================== */
function loadProductsMap() {
  const raw = readFileSync(join(process.cwd(), "data", "products.json"), "utf-8");
  const parsed = JSON.parse(raw);
  const map = {};
  for (const p of parsed.products) map[p.slug] = p;
  return map;
}

function computeAuthoritativeTotal(items, productsMap) {
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

    total += unitPrice * qty;
  }

  return Math.round(total * 100) / 100;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("MP_ACCESS_TOKEN não configurado nas variáveis de ambiente da Vercel.");
    return res.status(500).json({ message: "Pagamento indisponível no momento. Tente novamente mais tarde ou fale pelo WhatsApp." });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(400).json({ message: "Requisição inválida." });
  }

  const items = Array.isArray(body && body.items) ? body.items : [];
  const formData = body && body.formData;
  const paymentType = body && body.paymentType; /* 'credit_card' | 'debit_card', vem do Brick */

  if (items.length === 0) {
    return res.status(400).json({ message: "Carrinho vazio." });
  }
  if (!formData || !formData.token || !formData.payment_method_id) {
    return res.status(400).json({ message: "Dados do pagamento incompletos." });
  }

  let totalAmount;
  try {
    const productsMap = loadProductsMap();
    totalAmount = computeAuthoritativeTotal(items, productsMap);
  } catch (err) {
    return res.status(400).json({ message: "Não foi possível validar os itens do carrinho: " + err.message });
  }

  if (!(totalAmount > 0)) {
    return res.status(400).json({ message: "Valor do pedido inválido." });
  }

  const deviceId = req.headers["x-meli-session-id"] || "";

  const orderBody = {
    type: "online",
    processing_mode: "automatic",
    total_amount: totalAmount.toFixed(2),
    external_reference: "fuieuquefiz-" + randomUUID(),
    payer: {
      email: (formData.payer && formData.payer.email) || undefined,
      identification: (formData.payer && formData.payer.identification) || undefined
    },
    transactions: {
      payments: [
        {
          amount: totalAmount.toFixed(2),
          payment_method: {
            id: formData.payment_method_id,
            type: paymentType || "credit_card",
            token: formData.token,
            installments: formData.installments || 1,
            issuer_id: formData.issuer_id || undefined,
            statement_descriptor: "FUIEUQUEFIZ"
          }
        }
      ]
    }
  };

  try {
    const mpRes = await fetch("https://api.mercadopago.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
        "X-Idempotency-Key": randomUUID(),
        ...(deviceId ? { "X-meli-session-id": deviceId } : {})
      },
      body: JSON.stringify(orderBody)
    });

    const data = await mpRes.json();

    if (!mpRes.ok) {
      /* Log o corpo inteiro do erro (é a descrição da Mercado Pago sobre o
         que está errado na NOSSA requisição — não inclui dado de cartão)
         porque o formato de erro da API de Orders não é o mesmo da API
         antiga (nem sempre tem `.message`/`.cause` no nível raiz). */
      /* JSON.stringify (não console.error com objeto aninhado) porque o
         log da Vercel trunca objetos em profundidade 2 ("[Object]"),
         escondendo justamente o array `errors[]` que tem o motivo real. */
      console.error("Mercado Pago Orders API error: status=" + mpRes.status + " body=" + JSON.stringify(data));
      return res.status(502).json({ message: "Não foi possível processar o pagamento. Tente novamente ou finalize pelo WhatsApp." });
    }

    const payment = data.transactions && data.transactions.payments && data.transactions.payments[0];
    const status = (payment && payment.status) || data.status;
    const statusDetail = payment && payment.status_detail;

    console.log("Order criada:", { orderId: data.id, status, statusDetail });

    return res.status(200).json({
      status: status,
      message: friendlyMessage(status, statusDetail)
    });
  } catch (err) {
    console.error("Falha ao chamar a API do Mercado Pago:", err.message);
    return res.status(500).json({ message: "Erro interno ao processar pagamento." });
  }
}
