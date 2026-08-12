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
├── index.html              → Home (hero, seção "da floresta", destaques, sustentabilidade)
├── catalogo.html            → Catálogo completo (20 peças, filtro por categoria, ordenação)
├── produto.html              → Página de detalhe de produto (?slug=... na URL)
├── sobre.html                → Nossa história / Nossa madeira / Processo / Trabalhe conosco
├── contato.html               → Fale com a gente / FAQ / Entrega e frete / Garantia
├── checkout.html              → Checkout Transparente — Payment Brick embutido, sem sair do site
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
│   └── animations.css           → Reveal-on-scroll, morph de scroll, motion
├── js/
│   ├── products.js             → Dados completos do catálogo (descrição, materiais, imagem, preço de exibição)
│   ├── cart.js                 → Carrinho (localStorage) + checkout via WhatsApp — roda em toda página
│   ├── main.js                  → Nav, menu mobile, reveal-on-scroll, scroll suave — roda em toda página
│   ├── catalog.js               → Só em catalogo.html — grid filtrável/ordenável
│   ├── product-page.js           → Só em produto.html — monta a página a partir do ?slug=
│   ├── checkout-brick.js         → Só em checkout.html — monta o Payment Brick e envia pro backend
│   └── scroll-morph.js            → Só em index.html — anima a seção "da floresta ao móvel"
├── assets/
│   └── scroll-video/
│       ├── anel-madeira.mp4        → Vídeo hero de rolagem (já gerado no Higgsfield)
│       └── anel-madeira-poster.png → Poster/still do vídeo acima
└── HIGGSFIELD_PROMPTS.md          → Prompts prontos para gerar as fotos e o vídeo reais no Higgsfield
```

Ordem de carregamento dos scripts, em todas as páginas: `products.js` → `cart.js` → `main.js` → script específico da página (se houver), todos com `defer`.

## Antes de vender de verdade

O site está funcionalmente pronto, mas tem três coisas de conteúdo/config que **precisam** ser trocadas antes de divulgar o link para clientes reais:

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

### (c) Fotografia real dos 20 produtos

Hoje cada produto usa um gradiente de CSS como placeholder (`.product-shot` + classes `.shot-grad-1` a `.shot-grad-6`, geradas por `getShotGradient()` em `js/products.js`), com o aviso "Prévia artística — fotos reais em breve" sobreposto.

1. Use `HIGGSFIELD_PROMPTS.md` (Parte B) para gerar as 20 fotos no Higgsfield — um prompt por produto, já com o material e o estilo certos, extraídos de `js/products.js`.
2. Salve as imagens finais em uma nova pasta `assets/products/`, nomeadas pelo `slug` de cada produto (ex: `assets/products/mesa-de-jantar-vigamestra.jpg`).
3. Troque o placeholder por uma tag `<img>` real nos dois lugares onde ele é montado via JavaScript:
   - `js/catalog.js`, função `buildCard()` (por volta da linha 34–43): o `innerHTML` monta `<div class="product-shot GRADIENTE"><span class="product-shot-mark">...` — troque o conteúdo interno da `div.product-shot` por `<img src="assets/products/' + product.slug + '.jpg" alt="' + product.name + '">` e remova a classe de gradiente e o `<span class="product-shot-mark">`/`<span class="product-shot-note">` (eles deixam de fazer sentido com foto real).
   - `js/product-page.js`, função `render()` (bloco `.pdp-media`, por volta da linha 144–150) e função `renderRelated()` (por volta da linha 304–313): mesma troca — substituir o conteúdo da `div.product-shot` por uma `<img>` apontando para `assets/products/SLUG.jpg`.
   - A classe `.product-shot` em si (sombra, `border-radius`, `overflow: hidden` — ver `css/components.css`) não precisa mudar: ela já foi desenhada para envolver tanto o placeholder de gradiente quanto uma `<img>` real (veja a regra `.product-shot img { width: 100%; height: 100%; object-fit: cover; }`, já presente em `components.css`).

### (d) Vídeo hero de rolagem — ✅ já feito

A seção `#da-floresta` já usa um vídeo real gerado no Higgsfield (`assets/scroll-video/anel-madeira.mp4`, com `assets/scroll-video/anel-madeira-poster.png` como poster): uma bolacha de madeira cujos anéis se separam, giram e voltam ao normal, controlado por `video.currentTime` em `js/scroll-morph.js` conforme o usuário rola a página (para os dois lados). Ver `HIGGSFIELD_PROMPTS.md` (Parte A) para os prompts exatos usados e para instruções de como regenerar em maior resolução/duração para produção — o vídeo atual (720p, 6s) é uma boa prova de conceito, mas vale regerar em 1080p+ com `ffmpeg -movflags faststart` antes do lançamento final, para um scrubbing mais responsivo.

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
2. **"Pagar com cartão"** (Checkout Transparente) — leva para `checkout.html`, onde o **Payment Brick** do Mercado Pago é exibido embutido na página: o cliente preenche os dados do cartão **sem sair do site em nenhum momento**. Cartão de crédito e débito, parcelamento em até 12x, bandeira detectada automaticamente.

**Como funciona por trás:**
- `js/checkout-brick.js` monta o formulário do Brick e, ao enviar, gera um **token** do cartão no navegador (o número do cartão nunca passa pelo nosso servidor).
- O token vai para `api/create-order.js`, que **recalcula o total a partir de `data/products.json`** (nunca confia no valor que o navegador mandou), gera uma chave de idempotência nova a cada tentativa (evita cobrança duplicada), repassa o `X-meli-session-id` (device fingerprint antifraude, gerado pelo script `security.js` carregado em `checkout.html`), e cria a cobrança usando a **API de Orders** do Mercado Pago (`POST /v1/orders` — endpoint atual recomendado pela documentação oficial, não a API legada `/v1/payments`).
- A resposta (aprovado / em análise / recusado) aparece direto em `checkout.html`, com mensagem em português específica do motivo de recusa (cartão sem saldo, dados incorretos, etc. — ver a tabela `STATUS_DETAIL_MESSAGES` em `api/create-order.js`).
- O dinheiro cai direto no saldo da conta Mercado Pago da loja — sacar quando quiser, pelo próprio app/site do Mercado Pago.

**Importante sobre frete:** o checkout cobra só o valor das peças. O frete (que varia por CEP e por peça, ver `contato.html#entrega`) continua sendo combinado depois, pelo WhatsApp — é o que o resumo do pedido em `checkout.html` já avisa ao cliente.

**Sem banco de dados:** este site não tem persistência de pedidos (nem tinha antes). `api/webhook.js` valida a notificação do Mercado Pago e só loga o resultado — não grava em lugar nenhum. Se no futuro quiserem histórico de pedidos de verdade, isso significa adicionar um banco (ex: Vercel Postgres/KV), um passo maior não incluído aqui.

### Variáveis de ambiente necessárias

Configure as três na Vercel (Project Settings → Environment Variables) — **nunca em nenhum arquivo do projeto nem em conversas/chat**:

| Variável | Onde pegar |
|---|---|
| `MP_ACCESS_TOKEN` | [mercadopago.com.br/developers/panel](https://www.mercadopago.com.br/developers/panel) → sua aplicação → **Credenciais de produção** → campo "Access Token" (secreta — nunca vai para o navegador) |
| `MP_PUBLIC_KEY` | Mesma tela acima, campo "Public Key" (não é secreta — pode circular no navegador, é isso que `api/public-config.js` expõe) |
| `MP_WEBHOOK_SECRET` | Mesma aplicação → aba **Webhooks** → "Configurar notificação" → revelar a chave secreta gerada ali |

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
