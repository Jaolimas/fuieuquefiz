/* ==========================================================================
   FuiEuQueFiz — /api/webhook
   Vercel Serverless Function. Recebe as notificações assíncronas do
   Mercado Pago (status de pagamento mudou) e valida a assinatura antes de
   confiar em qualquer coisa que vier na notificação.

   Configuração necessária:
   1. Variável de ambiente MP_WEBHOOK_SECRET (Vercel → Environment Variables)
      — pegue em Suas integrações → Webhooks → Configurar notificação →
      revelar a chave secreta gerada.
   2. No painel do Mercado Pago, configure a URL de notificação apontando
      para https://SEUSITE.vercel.app/api/webhook.

   Validação da assinatura (x-signature), conforme documentação oficial:
   - Header x-signature vem no formato "ts=1704908010,v1=<hash hex>".
   - Header x-request-id.
   - Query string ?data.id=<id do recurso> (id do pagamento, em minúsculo
     no manifesto).
   - Manifesto: "id:{data.id};request-id:{x-request-id};ts:{ts};"
   - Assinatura esperada = HMAC-SHA256(manifesto, MP_WEBHOOK_SECRET) em hex.
   - Compara com v1 usando comparação de tempo constante.

   Sem banco de dados nesta versão do site (decisão registrada em
   HIGGSFIELD_PROMPTS.md/README): este endpoint valida e loga o resultado,
   mas não persiste pedido nenhum. Ver README.md para os próximos passos
   se quiserem adicionar persistência depois.

   O Mercado Pago exige resposta 200/201 em até 22 segundos — por isso essa
   função só valida e loga, sem chamadas lentas.

   Aviso de Pix pago no WhatsApp Business (lib/whatsapp.js): como o Pix só
   confirma de forma assíncrona (ao contrário do cartão, que api/create-
   order.js já avisa na hora), é aqui que isso acontece — busca o pagamento
   na Mercado Pago pelo id que veio na notificação e, se estiver pago,
   dispara o aviso. Só o valor total, não os itens — esta versão do site
   não persiste o carrinho em lugar nenhum, então não tem como saber quais
   peças eram depois que a página fecha.

   IMPORTANTE — ainda não testado contra um webhook real de Pix pago: o
   valor exato de `type` na query string e o `status` retornado por
   GET /v1/payments/{id} para um pagamento criado via API de Orders
   precisam ser conferidos no primeiro teste de verdade (ver os logs da
   Vercel). Ajuste notifyIfPaid() abaixo se vier diferente do esperado.
   ========================================================================== */

import { createHmac, timingSafeEqual } from "node:crypto";
import { notifyWhatsApp } from "../lib/whatsapp.js";

async function notifyIfPaid(paymentId) {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) return;

  const mpRes = await fetch("https://api.mercadopago.com/v1/payments/" + paymentId, {
    headers: { Authorization: "Bearer " + accessToken }
  });

  if (!mpRes.ok) {
    console.error("Falha ao buscar pagamento " + paymentId + " na Mercado Pago: status=" + mpRes.status);
    return;
  }

  const payment = await mpRes.json();

  /* "approved" é o status da API legada de Payments, que é o que esse
     GET devolve mesmo pra pagamentos criados via API de Orders — não
     confirmado ainda contra um Pix pago de verdade. */
  if (payment.status !== "approved") return;

  const totalText = "R$ " + Number(payment.transaction_amount || 0).toLocaleString("pt-BR");
  await notifyWhatsApp("Pix pago no site! Total: " + totalText + " (pagamento " + paymentId + ")");
}

function parseXSignature(header) {
  const parts = String(header || "").split(",");
  const out = {};
  for (const part of parts) {
    const [key, value] = part.split("=").map((s) => (s || "").trim());
    if (key) out[key] = value;
  }
  return out; /* { ts, v1 } */
}

function isValidSignature({ xSignature, xRequestId, dataId, secret }) {
  if (!xSignature || !xRequestId || !dataId || !secret) return false;

  const { ts, v1 } = parseXSignature(xSignature);
  if (!ts || !v1) return false;

  const manifest = `id:${String(dataId).toLowerCase()};request-id:${xRequestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const receivedBuf = Buffer.from(v1, "hex");
  if (expectedBuf.length !== receivedBuf.length) return false;

  return timingSafeEqual(expectedBuf, receivedBuf);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    console.error("MP_WEBHOOK_SECRET não configurado nas variáveis de ambiente da Vercel.");
    /* Responde 200 mesmo assim para o Mercado Pago não ficar reenviando —
       o problema é de configuração nossa, não da notificação em si. */
    return res.status(200).end();
  }

  const dataId = (req.query && (req.query["data.id"] || req.query.id)) || "";
  const xRequestId = req.headers["x-request-id"];
  const xSignature = req.headers["x-signature"];

  const valid = isValidSignature({ xSignature, xRequestId, dataId, secret });

  if (!valid) {
    console.warn("Webhook recebido com assinatura inválida — ignorado.", { dataId });
    return res.status(401).end();
  }

  /* Assinatura válida — loga só o essencial (id do recurso e tipo do
     evento), nunca dados de pagador/cartão. */
  const type = req.query && req.query.type;
  console.log("Webhook Mercado Pago validado:", { type, dataId });

  /* Best-effort: nunca deixa uma falha aqui derrubar a resposta 200 pro
     Mercado Pago (senão ele fica reenviando a mesma notificação). */
  if (dataId) {
    try {
      await notifyIfPaid(dataId);
    } catch (err) {
      console.error("Falha ao processar notificação de pagamento:", err.message);
    }
  }

  return res.status(200).end();
}
