# FuiEuQueFiz — site

Site institucional e catálogo da FuiEuQueFiz: móveis rústicos industriais de alto padrão, feitos à mão sob encomenda. O "checkout" é via WhatsApp — não há carrinho de pagamento online, gateway de pagamento ou backend.

## O que é este projeto

Um site 100% estático: HTML, CSS e JavaScript puros, sem framework, sem build step, sem `npm install`, sem servidor próprio. Todo o comportamento dinâmico (catálogo filtrável, carrinho, página de produto) roda no navegador, em JavaScript vanilla.

### Como visualizar localmente

Basta abrir `index.html` diretamente no navegador (duplo clique, ou arrastar para uma aba). Todos os links internos são relativos (`catalogo.html`, `css/tokens.css`, etc.), então a pasta inteira também pode ser copiada para qualquer host estático sem nenhum ajuste.

Se preferir servir por um servidor local simples (opcional, não obrigatório):

```
# Python 3
python -m http.server 8000

# ou, com Node instalado
npx serve .
```

## Estrutura de pastas

```
fuieuquefiz/
├── index.html              → Home (hero, vitrine de peças em carrossel de scroll travado, destaques, sustentabilidade)
├── catalogo.html            → Catálogo completo (15 peças, filtro por categoria, ordenação)
├── produto.html              → Página de detalhe de produto (?slug=... na URL)
├── sobre.html                → Nossa história / Nossa madeira / Processo / Trabalhe conosco
├── contato.html               → Fale com a gente / FAQ / Entrega e frete / Garantia
├── checkout.html              → Checkout Transparente — Payment Brick (cartão + Pix) embutido, sem sair do site
├── package.json                → Só declara "type": "module" (sintaxe ESM em api/*.js) — sem dependências, sem build step
├── data/
│   └── products.json          → Fonte de verdade dos PREÇOS (usada só pelo backend para validar o total)
├── api/
│   ├── create-order.js        → Recalcula o total e cria a cobrança na API de Orders do Mercado Pago
│   ├── public-config.js       → Expõe MP_PUBLIC_KEY (não secreta) para o checkout.html montar o Brick
│   └── webhook.js             → Recebe notificações do Mercado Pago, valida a assinatura (x-signature)
├── css/
│   ├── tokens.css            → Única fonte de verdade para cores, tipografia, espaçamento
│   ├── base.css               → Reset e defaults do documento
│   ├── components.css          → Todos os componentes visuais (nav, footer, cards, botões, etc.)
│   └── animations.css           → Reveal-on-scroll, carrossel de scroll travado, motion
├── js/
│   ├── products.js             → Dados completos do catálogo (descrição, materiais, imagem, preço de exibição)
│   ├── cart.js                 → Carrinho (localStorage) + checkout via WhatsApp — roda em toda página
│   ├── main.js                  → Nav, menu mobile, reveal-on-scroll, scroll suave — roda em toda página
│   ├── catalog.js               → Só em catalogo.html — grid filtrável/ordenável
│   ├── product-page.js           → Só em produto.html — monta a página a partir do ?slug=
│   ├── checkout-brick.js         → Só em checkout.html — monta o Payment Brick (cartão + Pix) e envia pro backend
│   └── scroll-morph.js            → Só em index.html — controla o carrossel de peças em destaque via scroll travado
├── assets/
│   └── scroll-video/          → Vídeos de versões anteriores do hero (não usados hoje — hero agora é o carrossel de fotos em index.html); mantidos caso queiram reaproveitar em outra seção
└── HIGGSFIELD_PROMPTS.md          → Prompts prontos usados para gerar as fotos reais dos produtos no Higgsfield
```

Ordem de carregamento dos scripts, em todas as páginas: `products.js` → `cart.js` → `main.js` → script específico da página (se houver), todos com `defer`.

## Antes de vender de verdade

O site está funcionalmente pronto, mas ainda tem duas coisas de config que **precisam** ser trocadas antes de divulgar o link para clientes reais (fotografia dos produtos e vitrine do hero já estão feitas — itens (c) e (d) abaixo, mantidos como referência):

### (a) Número de WhatsApp placeholder

O número `5500000000000` é um placeholder e aparece em **8 arquivos**. Troque-o pelo número real da loja em todos eles (todos marcados com um comentário `TODO` no próprio código):

- `index.html` — CTA do hero ("Falar com um especialista") e link "WhatsApp" no rodapé.
- `catalogo.html` — link "WhatsApp" no rodapé.
- `produto.html` — link "WhatsApp" no rodapé.
- `sobre.html` — botão "Falar com a gente no WhatsApp" (seção Trabalhe conosco) e link "WhatsApp" no rodapé.
- `contato.html` — botão "Chamar no WhatsApp" e link "WhatsApp" no rodapé.
- `js/cart.js` — dentro de `checkoutViaWhatsApp()`, é o número usado para finalizar o pedido a partir do carrinho.

Dica: buscar por `5500000000000` em todos os arquivos do projeto (ex: `Ctrl+Shift+F` no VS Code, ou `grep -rn "5500000000000" .`) garante que nenhuma ocorrência fique para trás.

### (b) E-mail placeholder

`contato.html` usa `contato@fuieuquefiz.com.br` como e-mail de suporte (botão "Enviar e-mail", marcado com `TODO` no HTML). Troque pelo e-mail real de atendimento da loja.

### (c) Fotografia real dos produtos — ✅ já feito

Os 15 produtos do catálogo (`js/products.js`) já usam foto real (`assets/products/SLUG.png`), sem placeholder de gradiente — `js/catalog.js` e `js/product-page.js` montam `<img>` direto a partir do campo `image` de cada produto (`productShotHTML()` em `js/products.js`). Pra trocar a foto de um produto, basta substituir o arquivo em `assets/products/` (mesmo nome) ou apontar o campo `image` pra outro arquivo — nada de código pra mexer.

### (d) Vitrine de peças no hero (carrossel de scroll travado) — ✅ já feito

A seção `#sob-a-luz` em `index.html` mostra um carrossel com 6 peças reais do catálogo (fotos de `assets/products/`), cada uma um link pra sua página de produto. `js/scroll-morph.js` pina a seção (`position: sticky`) e usa a posição do scroll dentro dela pra decidir qual `.morph-carousel-item` fica visível — mesmo mecanismo de "scroll travado" da versão anterior (que usava um vídeo único), só que agora dirigido por posição/índice de slide em vez de `video.currentTime`.

Pra trocar quais peças aparecem (ou quantas), edite direto o HTML em `index.html` dentro de `#morph-carousel` — cada `<a class="morph-carousel-item">` tem `data-name`/`data-price` (usados pra montar a legenda) e a imagem/link do produto; não precisa tocar em `scroll-morph.js`. Os vídeos de versões anteriores do hero ficam em `assets/scroll-video/`, sem uso atualmente — ver `HIGGSFIELD_PROMPTS.md` (Parte A) se quiserem reaproveitar o conceito de vídeo em outro lugar do site.

## Como publicar (deploy)

O site deixou de ser 100% estático: `api/create-order.js`, `api/public-config.js` e `api/webhook.js` são funções serverless que precisam rodar num servidor (ver seção "Pagamento com Mercado Pago" abaixo). Por isso, **a publicação precisa ser na Vercel** — Netlify e GitHub Pages não rodam essas funções sem reescrevê-las no formato deles.

**Publicar na Vercel (drag-and-drop, sem precisar de Git/GitHub):**
1. Crie uma conta em [vercel.com](https://vercel.com) (gratuita).
2. No dashboard, "Add New…" → "Project" → aba de importação manual → arraste a pasta inteira do projeto (a que contém `index.html`, `api/`, `data/`, etc.).
3. A Vercel detecta sozinha os arquivos estáticos na raiz e as funções dentro de `api/` — não precisa configurar build command nem output directory.
4. Antes de clicar em "Deploy" (ou depois, em Project Settings → Environment Variables), configure as 3 variáveis de ambiente da próxima seção. Sem elas, o site funciona normalmente, só o checkout com cartão fica indisponível.
5. Pronto — a Vercel já publica com HTTPS automático. Domínio próprio: Project Settings → Domains (ver instruções no próprio painel).

Se preferir integração contínua (deploy automático a cada alteração), suba a pasta para um repositório no GitHub e conecte esse repositório à Vercel em vez do upload manual — o fluxo de configuração das variáveis é o mesmo.

## Pagamento com Mercado Pago

O carrinho (`js/cart.js`) tem duas formas de finalizar pedido:

1. **"Finalizar pedido via WhatsApp"** (como antes) — monta a lista e abre o WhatsApp da loja, sem cobrança automática.
2. **"Pagar com cartão"** (Checkout Transparente) — leva para `checkout.html`, onde o **Payment Brick** do Mercado Pago é exibido embutido na página: o cliente paga **sem sair do site em nenhum momento**, com cartão de crédito/débito (parcelamento em até 12x, bandeira detectada automaticamente) ou **Pix**.

**Como funciona por trás:**
- `js/checkout-brick.js` monta o formulário do Brick (`customization.paymentMethods.bankTransfer: "all"` habilita o Pix, junto de `creditCard`/`debitCard`) e, ao enviar, gera um **token** do cartão no navegador (o número do cartão nunca passa pelo nosso servidor) — Pix não usa token, só o `payment_method_id: "pix"`.
- Os dados vão para `api/create-order.js`, que **recalcula o total a partir de `data/products.json`** (nunca confia no valor que o navegador mandou), gera uma chave de idempotência nova a cada tentativa (evita cobrança duplicada), repassa o `X-meli-session-id` (device fingerprint antifraude, gerado pelo script `security.js` carregado em `checkout.html`), e cria a cobrança usando a **API de Orders** do Mercado Pago (`POST /v1/orders` — endpoint atual recomendado pela documentação oficial, não a API legada `/v1/payments`).
- Cartão aprova (ou recusa) na hora. **Pix é assíncrono**: a resposta já vem com o QR Code/código copia-e-cola (`payload.result.pix`, exibido por `showPix()` em `checkout-brick.js`), mas a confirmação real do pagamento só chega depois, via `api/webhook.js`, quando o cliente paga pelo app do banco.
- A resposta (aprovado / em análise / recusado) aparece direto em `checkout.html`, com mensagem em português específica do motivo (cartão sem saldo, dados incorretos, aguardando Pix, etc. — ver a tabela `STATUS_DETAIL_MESSAGES` em `api/create-order.js`). ⚠️ O `status`/`status_detail` que a API de Orders devolve usa um vocabulário próprio (`processed`=aprovado, `action_required`/`waiting_transfer`=aguardando Pix, etc.), diferente da API antiga — `categorizeStatus()` em `api/create-order.js` normaliza isso.
- O dinheiro cai direto no saldo da conta Mercado Pago da loja — sacar quando quiser, pelo próprio app/site do Mercado Pago.

**Importante sobre frete:** o checkout cobra só o valor das peças. O frete (que varia por CEP e por peça, ver `contato.html#entrega`) continua sendo combinado depois, pelo WhatsApp — é o que o resumo do pedido em `checkout.html` já avisa ao cliente.

**Sem banco de dados:** este site não tem persistência de pedidos (nem tinha antes). `api/webhook.js` valida a notificação do Mercado Pago e só loga o resultado — não grava em lugar nenhum. Se no futuro quiserem histórico de pedidos de verdade, isso significa adicionar um banco (ex: Vercel Postgres/KV), um passo maior não incluído aqui.

### Resumo do pedido por e-mail (Resend)

Depois que a order é criada com sucesso (cartão aprovado ou Pix pendente), `checkout.html` mostra um card com o resumo do pedido (peça, quantidade, valor, total) e um campo pra digitar o e-mail e receber esse resumo — é opt-in, o cliente decide se quer, não é automático.

- `js/checkout-brick.js` (`showReceipt()`) monta o card a partir dos mesmos itens do carrinho; ao enviar o formulário, chama `api/send-receipt.js`.
- `api/send-receipt.js` **recalcula preço e total a partir de `data/products.json`** (mesma regra de segurança do `create-order.js` — nunca confia em valor vindo do navegador) e envia o e-mail via API HTTP do [Resend](https://resend.com) (sem SDK, `fetch` direto — mesmo padrão usado pra Mercado Pago).
- ⚠️ **Enquanto nenhum domínio estiver verificado na conta Resend, só é possível enviar para o e-mail com que a conta foi criada** (restrição deles, não deste código — evita spam antes da verificação). Depois de verificar um domínio próprio (ex: `fuieuquefiz.com.br`, com os registros DNS SPF/DKIM que o painel do Resend pedir), configure `RESEND_FROM_EMAIL` com um remetente desse domínio (ex: `"FuiEuQueFiz <pedidos@fuieuquefiz.com.br>"`) e o envio passa a funcionar pra qualquer cliente, sem mexer em código.

### Variáveis de ambiente necessárias

Configure na Vercel (Project Settings → Environment Variables) — **nunca em nenhum arquivo do projeto nem em conversas/chat**:

| Variável | Onde pegar |
|---|---|
| `MP_ACCESS_TOKEN` | [mercadopago.com.br/developers/panel](https://www.mercadopago.com.br/developers/panel) → sua aplicação → **Credenciais de produção** → campo "Access Token" (secreta — nunca vai para o navegador) |
| `MP_PUBLIC_KEY` | Mesma tela acima, campo "Public Key" (não é secreta — pode circular no navegador, é isso que `api/public-config.js` expõe) |
| `MP_WEBHOOK_SECRET` | Mesma aplicação → aba **Webhooks** → "Configurar notificação" → revelar a chave secreta gerada ali |
| `RESEND_API_KEY` | [resend.com/api-keys](https://resend.com/api-keys) → criar API key (secreta) |
| `RESEND_FROM_EMAIL` | Opcional — padrão é `"FuiEuQueFiz <onboarding@resend.dev>"` (só funciona pro próprio e-mail da conta Resend); depois de verificar domínio próprio, troque por um remetente desse domínio |

Depois de salvar, redeploy o projeto (qualquer alteração de variável de ambiente pede um novo deploy para valer).

### Configurar o webhook no painel do Mercado Pago

Em Suas integrações → sua aplicação → **Webhooks** → "Configurar notificação", cole a URL:

```
https://SEUSITE.vercel.app/api/webhook
```

(troque `SEUSITE` pelo seu domínio real de produção). Selecione pelo menos o evento de pagamentos (`payment`). É essa tela que também gera o `MP_WEBHOOK_SECRET` da tabela acima.

### Testar antes de valer pra valer

⚠️ **A API de Orders (`/v1/orders`, usada em `api/create-order.js`) não aceita credenciais `TEST-...`** — diferente da API antiga de pagamentos. A própria documentação do Mercado Pago é explícita: *"There is no support for test credentials. Use test users with production credentials for the sandbox environment."* O jeito certo de testar é:

1. Configure `MP_ACCESS_TOKEN`/`MP_PUBLIC_KEY` na Vercel com as credenciais de **produção** (`APP_USR-...`) da sua conta real — mesmo para testar. É isso que faz a chamada à API funcionar; o "modo sandbox" não vem da chave, vem dos dados de teste do passo 2.
2. No formulário de pagamento (`checkout.html`), preencha com um **cartão de teste oficial** + um **nome de titular "mágico"** que diz pra Mercado Pago qual resultado simular. Dados para simular um pagamento **aprovado** no Brasil:

   | Campo | Valor |
   |---|---|
   | Número do cartão | `5480 8328 0103 3311` (Mastercard) ou `4235 6477 2802 5682` (Visa) |
   | Nome do titular | `APRO` |
   | Validade | `11/30` |
   | CVV | `123` |
   | E-mail | `test@testuser.com` (obrigatório ser esse e-mail em ambiente de teste) |
   | CPF (se pedir) | `12345678909` |

   Trocando só o nome do titular dá pra simular outros resultados — útil para testar as mensagens em português de `STATUS_DETAIL_MESSAGES` em `api/create-order.js`: `FUND` (saldo insuficiente), `SECU` (CVV inválido), `EXPI` (validade inválida), `CALL` (autorização manual do banco), `CONT` (pagamento pendente), `OTHE` (erro geral). Números de cartão, e-mail e nomes mágicos são específicos do Brasil e podem mudar — confira a versão atual em "Cartões de teste" no [painel de desenvolvedor](https://www.mercadopago.com.br/developers/panel) se algo parar de funcionar. Usar um cartão fora dessa lista (mesmo que pareça válido) faz a Mercado Pago tentar processar de verdade e retornar `status_detail: "processing_error"`, sem detalhar o motivo.
3. Se der erro, confira no log da Vercel (aba **Logs** do projeto) a linha `Mercado Pago Orders API error: status=... body=...` — o corpo vem em JSON completo (não trunca), com o array `errors[]` explicando exatamente o que a Mercado Pago recusou. `api/create-order.js` também loga `{ orderId, status, statusDetail }` quando dá certo, e `api/webhook.js` loga `"Webhook Mercado Pago validado"` quando a notificação chega.
4. Como as credenciais de teste e de produção são as mesmas (`APP_USR-...`), não há "troca de chave" antes de ir ao ar — só pare de usar os dados de cartão de teste e deixe os clientes reais pagarem com os cartões deles.

## Sobre o modelo de checkout (importante)

O checkout via WhatsApp continua existindo — pagamento com cartão é uma opção a mais, não uma substituição. Isso significa que a loja pode operar dos dois jeitos: negociação manual por WhatsApp (mais flexível, útil para peças sob encomenda com prazo/acabamento a combinar) ou pagamento imediato com cartão (mais rápido para o cliente, mas cobra só o valor das peças, sem frete).
