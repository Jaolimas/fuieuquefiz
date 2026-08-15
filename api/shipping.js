/* ==========================================================================
   FuiEuQueFiz — /api/shipping
   Vercel Serverless Function (Node.js runtime). Prévia do frete durante o
   checkout, antes de pagar: recebe o endereço digitado em checkout.html
   (js/checkout-address.js) e devolve { ok, fee, distanceKm } ou
   { ok: false, message }, usando lib/shipping.js (mesma lógica reusada,
   sem duplicar, em api/create-order.js e api/send-receipt.js).

   Só um preview — quem decide de verdade se o pedido pode ser cobrado é
   sempre api/create-order.js, que chama lib/shipping.js de novo com o
   endereço que veio junto da submissão do pagamento.
   ========================================================================== */

import { calculateShipping } from "../lib/shipping.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Método não permitido." });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(400).json({ ok: false, message: "Requisição inválida." });
  }

  const address = body && typeof body.address === "object" ? body.address : null;
  const result = await calculateShipping(address);

  return res.status(result.ok ? 200 : 400).json(result);
}
