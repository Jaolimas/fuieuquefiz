/* ==========================================================================
   FuiEuQueFiz — /api/public-config
   Vercel Serverless Function. Returns the Mercado Pago PUBLIC key so
   js/checkout-brick.js can initialize the Payment Brick without that key
   being hardcoded into a committed static file (this page has no build
   step / templating, so there's no other way to inject an env var into
   plain HTML/JS at request time).

   This is safe to expose: the Public Key is, by design, meant to run in
   the browser (it cannot create charges or move money on its own — only
   the secret MP_ACCESS_TOKEN, used server-side in api/create-order.js,
   can do that).

   Variável de ambiente necessária: MP_PUBLIC_KEY (Vercel → Environment
   Variables — pegue em Suas integrações → Credenciais no painel do
   Mercado Pago).
   ========================================================================== */

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido." });
  }

  const publicKey = process.env.MP_PUBLIC_KEY;
  if (!publicKey) {
    console.error("MP_PUBLIC_KEY não configurado nas variáveis de ambiente da Vercel.");
    return res.status(500).json({ error: "Configuração de pagamento indisponível." });
  }

  res.setHeader("Cache-Control", "public, max-age=300");
  return res.status(200).json({ publicKey });
}
