/* ==========================================================================
   FuiEuQueFiz — lib/whatsapp.js
   Notifica a loja via WhatsApp Business (Cloud API da Meta) quando um
   pedido é pago — chamado por api/create-order.js (cartão, aprovação na
   hora) e api/webhook.js (Pix, confirmação assíncrona).

   Fica em lib/, não em api/, porque a Vercel transforma automaticamente
   todo arquivo dentro de api/ numa rota HTTP própria — este é só um
   módulo importado pelos dois arquivos acima, não um endpoint.

   Variáveis de ambiente necessárias (Vercel → Environment Variables):
     WHATSAPP_ACCESS_TOKEN    — token permanente (System User) do app da
       Meta (Meta Business Suite → System Users → gerar token com o
       produto WhatsApp e a permissão whatsapp_business_messaging).
     WHATSAPP_PHONE_NUMBER_ID — ID do número registrado na Cloud API (não
       é o número de telefone em si — é o ID que a Meta atribui a ele,
       visível no painel do produto WhatsApp do seu app).
     WHATSAPP_NOTIFY_TO       — número que deve RECEBER os avisos de
       pedido (normalmente o número da própria loja), com código do país,
       ex: "5511999999999" — sem espaços, sem "+", sem símbolos.
     WHATSAPP_TEMPLATE_NAME   — opcional, nome do template aprovado no
       Meta Business Manager (padrão: "novo_pedido"). Mensagens
       business-iniciadas como essa (a loja avisando a si mesma, sem o
       destinatário ter mandado mensagem antes) exigem um template
       pré-aprovado pela Meta — não dá pra mandar texto livre aqui.

   Se as variáveis não estiverem configuradas, a notificação é pulada
   silenciosamente (só loga um aviso) — nunca derruba o fluxo de
   pagamento do cliente.
   ========================================================================== */

export async function notifyWhatsApp(bodyText) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const to = process.env.WHATSAPP_NOTIFY_TO;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || "novo_pedido";

  if (!token || !phoneNumberId || !to) {
    console.warn("Notificação WhatsApp pulada: WHATSAPP_ACCESS_TOKEN/WHATSAPP_PHONE_NUMBER_ID/WHATSAPP_NOTIFY_TO não configurados.");
    return;
  }

  try {
    const res = await fetch("https://graph.facebook.com/v20.0/" + phoneNumberId + "/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to,
        type: "template",
        template: {
          name: templateName,
          language: { code: "pt_BR" },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: bodyText }]
            }
          ]
        }
      })
    });

    const data = await res.json();

    if (!res.ok) {
      /* JSON.stringify — mesma lição das outras integrações (create-order.js,
         send-receipt.js): a Vercel trunca objetos aninhados no log. */
      console.error("WhatsApp API error: status=" + res.status + " body=" + JSON.stringify(data));
    }
  } catch (err) {
    console.error("Falha ao chamar a API do WhatsApp:", err.message);
  }
}
