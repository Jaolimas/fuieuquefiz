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
├── index.html              → Home (hero, quiz de estilo que recomenda uma peça, destaques, sustentabilidade)
├── catalogo.html            → Catálogo completo (19 peças, filtro por categoria, ordenação)
├── produto.html              → Página de detalhe de produto (?slug=... na URL)
├── sobre.html                → Nossa história / Nossa madeira / Processo / Trabalhe conosco
├── contato.html               → Fale com a gente / FAQ / Entrega e frete / Garantia
├── checkout.html              → Checkout Transparente — Payment Brick (cartão + Pix) embutido, sem sair do site
├── termos-de-uso.html          → Termos de uso — texto de referência, ver item (f) abaixo
├── politica-de-privacidade.html → Política de privacidade (LGPD) — texto de referência, ver item (f) abaixo
├── package.json                → Só declara "type": "module" (sintaxe ESM em api/*.js) — sem dependências, sem build step
├── data/
│   └── products.json          → Fonte de verdade dos PREÇOS (usada só pelo backend para validar o total)
├── api/
│   ├── create-order.js        → Recalcula o total (itens + frete) e cria a cobrança na API de Orders do Mercado Pago
│   ├── public-config.js       → Expõe MP_PUBLIC_KEY (não secreta) para o checkout.html montar o Brick
│   ├── send-receipt.js        → Envia o resumo do pedido por e-mail (Resend), recalculando os valores
│   ├── shipping.js            → Prévia do frete no checkout (antes de pagar), a partir do endereço digitado
│   └── webhook.js             → Recebe notificações do Mercado Pago, valida a assinatura (x-signature)
├── lib/
│   ├── whatsapp.js            → Avisa a loja no WhatsApp Business (Cloud API) quando um pedido é pago — não é rota, é módulo importado por api/create-order.js e api/webhook.js
│   └── shipping.js            → Geocodifica o endereço (Nominatim) e calcula o frete por distância até Campinas-SP — módulo importado por api/shipping.js, api/create-order.js e api/send-receipt.js
├── css/
│   ├── tokens.css            → Única fonte de verdade para cores, tipografia, espaçamento
│   ├── base.css               → Reset e defaults do documento
│   ├── components.css          → Todos os componentes visuais (nav, footer, cards, botões, etc.)
│   └── animations.css           → Reveal-on-scroll, madeira revelada pelo cursor, motion
├── js/
│   ├── products.js             → Dados completos do catálogo (descrição, materiais, imagem, preço de exibição)
│   ├── cart.js                 → Carrinho (localStorage) + checkout via WhatsApp — roda em toda página
│   ├── main.js                  → Nav, menu mobile, reveal-on-scroll, scroll suave — roda em toda página
│   ├── catalog.js               → Só em catalogo.html — grid filtrável/ordenável
│   ├── product-page.js           → Só em produto.html — monta a página a partir do ?slug=
│   ├── checkout-address.js        → Só em checkout.html — formulário de endereço obrigatório, autocompleta por CEP (ViaCEP) e dispara o cálculo de frete
│   ├── checkout-brick.js         → Só em checkout.html — monta o Payment Brick (cartão + Pix) e envia pro backend
│   ├── style-quiz.js              → Só em index.html — quiz de 3 perguntas que recomenda uma peça do catálogo
│   └── search.js                  → Roda em toda página — busca client-side sobre PRODUCTS, painel que abre no ícone de lupa do nav
├── assets/
│   └── scroll-video/          → Vídeos de versões anteriores do hero (não usados hoje — hero foi substituído por fotos e depois pelo quiz de estilo em index.html); mantidos caso queiram reaproveitar em outra seção
└── HIGGSFIELD_PROMPTS.md          → Prompts prontos usados para gerar as fotos reais dos produtos no Higgsfield
```

Ordem de carregamento dos scripts, em todas as páginas: `products.js` → `cart.js` → `main.js` → script específico da página (se houver), todos com `defer`.

## Antes de vender de verdade

O site está funcionalmente pronto, mas ainda tem algumas coisas de config/conteúdo que **precisam** ser trocadas antes de divulgar o link para clientes reais (fotografia dos produtos e vitrine do hero já estão feitas — itens (d) e (e) abaixo, mantidos como referência):

### (a) Número de WhatsApp placeholder

O número `5500000000000` é um placeholder e aparece em **10 arquivos**. Troque-o pelo número real da loja em todos eles (todos marcados com um comentário `TODO` no próprio código):

- `index.html` — CTA do hero ("Falar com um especialista") e link "WhatsApp" no rodapé.
- `catalogo.html` — link "WhatsApp" no rodapé.
- `produto.html` — link "WhatsApp" no rodapé.
- `sobre.html` — botão "Falar com a gente no WhatsApp" (seção Trabalhe conosco) e link "WhatsApp" no rodapé.
- `contato.html` — botão "Chamar no WhatsApp" e link "WhatsApp" no rodapé.
- `termos-de-uso.html` / `politica-de-privacidade.html` — link de contato no final do texto, e link "WhatsApp" no rodapé.
- `js/cart.js` — dentro de `checkoutViaWhatsApp()`, é o número usado para finalizar o pedido a partir do carrinho.

Dica: buscar por `5500000000000` em todos os arquivos do projeto (ex: `Ctrl+Shift+F` no VS Code, ou `grep -rn "5500000000000" .`) garante que nenhuma ocorrência fique para trás.

### (b) E-mail placeholder

`contato.html`, `termos-de-uso.html` e `politica-de-privacidade.html` usam `contato@fuieuquefiz.com.br` como e-mail de suporte (marcado com `TODO` no HTML de cada um). Troque pelo e-mail real de atendimento da loja.

### (c) Depoimentos de exemplo

A seção "O que nossos clientes dizem" em `index.html` (logo antes de "Explore o catálogo completo") tem 3 depoimentos de exemplo, fictícios, marcados com um comentário `TODO` no HTML — troque pelos depoimentos reais de clientes (com autorização deles pra usar nome/avaliação no site) antes de divulgar a página. Cada `<blockquote class="testimonial-card">` tem a nota em estrelas, o texto e a assinatura (nome + cidade) — é só editar o texto direto no HTML, não precisa mexer no CSS/JS.

### (d) Fotografia real dos produtos — ✅ já feito

Os 15 produtos do catálogo (`js/products.js`) já usam foto real (`assets/products/SLUG.png`), sem placeholder de gradiente — `js/catalog.js` e `js/product-page.js` montam `<img>` direto a partir do campo `image` de cada produto (`productShotHTML()` em `js/products.js`). Pra trocar a foto de um produto, basta substituir o arquivo em `assets/products/` (mesmo nome) ou apontar o campo `image` pra outro arquivo — nada de código pra mexer.

**Galeria de fotos (vários ângulos):** 8 produtos têm um campo extra `gallery` em `js/products.js` — um array com fotos adicionais do mesmo móvel (`["assets/products/SLUG-2.jpg", "assets/products/SLUG-3.jpg", ...]`). Quando `gallery` existe, `produto.html` mostra miniaturas clicáveis embaixo da foto principal (`js/product-page.js`, `renderGalleryThumbs()`); sem `gallery`, o produto mostra só a foto única, como antes. Pra adicionar mais ângulos a um produto, solte os arquivos em `assets/products/` e acrescente os caminhos no array `gallery` — não precisa mexer no JS.

### (e) Quiz de estilo no hero — ✅ já feito

A seção `#quiz-estilo` em `index.html` roda um quiz de 3 perguntas ("que tipo de peça", "qual clima", "qual faixa de investimento") que filtra o array `PRODUCTS` (`js/products.js`) até recomendar 1-2 peças do catálogo — sem scroll-jacking, sem backend, é só uma seção normal que rola com o resto da página. `js/style-quiz.js` monta cada pergunta/resultado e cuida do "Adicionar à lista".

Essa seção já passou por duas versões antes: um vídeo único (aposentado, arquivos em `assets/scroll-video/`) e depois um carrossel de fotos com scroll travado (aposentado também, pra dar lugar a algo mais interativo/pesquisado — o padrão de quiz de descoberta converte melhor que vitrines passivas em marcas DTC). Cada produto em `js/products.js` tem um campo `styleTag` (`"bruto"` / `"estruturado"` / `"escultural"`, curado à mão) usado pela pergunta 2 do quiz — se adicionar um produto novo, vale atribuir um `styleTag` também, senão o quiz só ignora esse filtro pra ele.

Pra mudar as perguntas/opções, edite o array `QUESTIONS` no topo de `js/style-quiz.js` — a lógica de recomendação (`pickRecommendation()`) já lida com qualquer combinação de categoria/preço/estilo que não tenha resultado exato, recuando pro filtro anterior.

### (f) Termos de uso e política de privacidade — ⚠️ revisar antes de publicar

`termos-de-uso.html` e `politica-de-privacidade.html` têm texto real (não é lorem ipsum), escrito pra refletir com precisão o que o site faz hoje — checkout via WhatsApp ou cartão/Pix pelo Mercado Pago, e-mail de recibo pelo Resend, aviso à loja pelo WhatsApp Business, carrinho só em localStorage, sem cookies/analytics de terceiros. **Isso não substitui revisão por um advogado** antes de valer pra clientes de verdade — a LGPD tem exigências específicas (nomear encarregado/DPO, prazos de resposta a titulares de dados etc.) que merecem um olhar profissional, e as cláusulas de garantia/trocas também deveriam ser conferidas contra o Código de Defesa do Consumidor. Ambas as páginas têm um comentário HTML no topo (não visível pro visitante) com esse mesmo aviso.

### (g) Busca — ✅ já feito

O ícone de lupa no nav (`#search-toggle`, presente em toda página) abre um painel de busca (`js/search.js`) que filtra o array `PRODUCTS` por nome, categoria e descrição curta — sem backend, sem índice separado, e ignora acentos (buscar "aco" encontra "aço"). Clicar num resultado leva direto pra `produto.html?slug=...`.

### (h) Cupons de desconto e e-mail de agradecimento — ✅ já feito

Além do desconto automático de 5% pra pedidos ≥ R$3.000 (brinde + desconto, ver `js/products.js`), o site agora aceita cupons digitados manualmente no checkout (`#checkout-coupon-input`/`#checkout-coupon-apply` em `checkout.html`):

- **`FAMILIAROSA`** — 5% de desconto, funciona em **qualquer valor de pedido**, mesmo abaixo de R$3.000 (mas sem o brinde físico, que continua exigindo o limite de R$3.000 de verdade).
- **`OBRIGADO10`** — 10% de desconto. Esse cupom **não aparece em nenhum lugar do site** — só é revelado dentro do e-mail de agradecimento enviado depois de uma compra (ver abaixo), como recompensa pra próxima compra.

Regra de acúmulo: o desconto aplicado é sempre o **maior entre** o desconto automático (5% se passou de R$3.000) e o desconto do cupom digitado — nunca soma os dois. `computeOrderTotals(subtotal, couponCode)` em `js/products.js` decide isso no cliente (só pra exibição); a decisão que **vale de verdade** é sempre recalculada no servidor, em `applyGiftDiscount()` — duplicada com o mesmo comportamento em `api/create-order.js` (cobrança) e `api/send-receipt.js` (e-mail), igual ao restante da lógica de preço deste projeto.

Ao aplicar um cupom válido, `js/checkout-brick.js` recalcula o total e **remonta o Payment Brick do zero** (`unmount()` + `create()` de novo) — a API do Mercado Pago não permite atualizar o valor de um Brick já montado.

**E-mail de agradecimento:** todo e-mail de resumo de pedido enviado por `api/send-receipt.js` (o card opt-in que aparece depois do pagamento, ver seção "Resumo do pedido por e-mail" abaixo) agora também leva uma nota de agradecimento mencionando o cupom `OBRIGADO10` pra próxima compra — é intencional que isso só chegue pra quem realmente comprou e pediu o e-mail, sem nenhuma divulgação do cupom em banner, página ou pop-up do site.

### (i) Endereço de entrega obrigatório e frete por distância — ✅ já feito

No pagamento com cartão/Pix (`checkout.html`), o cliente precisa preencher um endereço de entrega completo (CEP, rua, número, complemento opcional, bairro, cidade, UF) **antes** de ver o resumo/formulário de pagamento — `#checkout-grid` só é revelado depois que o endereço é confirmado com sucesso (evento `checkout:address-confirmed`, disparado por `js/checkout-address.js`). O CEP autocompleta rua/bairro/cidade/UF via [ViaCEP](https://viacep.com.br) (gratuito, sem chave) — o cliente ainda pode corrigir qualquer campo antes de enviar.

O frete é calculado pela distância (linha reta) entre o endereço e a oficina em Campinas-SP:

- **Grátis até 80km.**
- **+R$ 50 entre 80km e 100km.**
- **Recusado acima de 100km** — a mensagem de erro deixa claro que a loja não entrega nesse raio ainda.

Toda a lógica de geocodificação (via [Nominatim/OpenStreetMap](https://nominatim.openstreetmap.org), gratuito, sem chave) e cálculo de distância (fórmula de Haversine) vive em `lib/shipping.js`, importado por três rotas — `api/shipping.js` (prévia no checkout, antes de pagar), `api/create-order.js` (cobrança de verdade) e `api/send-receipt.js` (e-mail de recibo) — em vez de duplicado como a regra de desconto, já que depende de uma chamada de rede. **O frete nunca é confiado a partir do navegador**: mesmo que a prévia mostrada no checkout diga "grátis", `api/create-order.js` geocodifica o endereço de novo e recusa/cobra o valor certo antes de criar a cobrança.

⚠️ Como a Nominatim é um serviço público e gratuito (sem SLA), pode falhar ou não localizar um endereço digitado de forma incomum — nesse caso o cliente vê uma mensagem pedindo pra conferir os dados ou finalizar pelo WhatsApp, em vez de deixar passar um frete errado. Esse mesmo limite de 100km (e a régua de frete grátis/pago) também foi atualizado em `contato.html` (FAQ e seção "Entrega e frete") e nas páginas legais (`termos-de-uso.html`, `politica-de-privacidade.html`), que antes diziam "entregamos para todo o país".

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
| `WHATSAPP_ACCESS_TOKEN` | Opcional — [developers.facebook.com](https://developers.facebook.com) → app → produto WhatsApp → Meta Business Suite → System Users → gerar token permanente (secreta) |
| `WHATSAPP_PHONE_NUMBER_ID` | Mesmo app → produto WhatsApp → "ID do número de telefone" (não é o número em si) |
| `WHATSAPP_NOTIFY_TO` | Número que deve receber os avisos de pedido pago (com código do país, ex: `5511999999999`, sem espaços/símbolos) |
| `WHATSAPP_TEMPLATE_NAME` | Opcional — padrão `"novo_pedido"`; precisa ser o nome exato de um template aprovado no Meta Business Manager |

Depois de salvar, redeploy o projeto (qualquer alteração de variável de ambiente pede um novo deploy para valer).

### Avisar a loja no WhatsApp Business quando um pedido é pago

Além do checkout via WhatsApp manual (o cliente monta a lista e você combina tudo por lá), o site também pode **avisar automaticamente o número da loja** assim que um pedido é pago — cartão aprova na hora (`api/create-order.js`), Pix confirma depois, de forma assíncrona (`api/webhook.js`). A lógica de envio está isolada em `lib/whatsapp.js`.

Isso usa a **API oficial do WhatsApp Business (Cloud API, da Meta)** — diferente do link `wa.me` usado no resto do site, essa parte manda mensagem "de dentro pra fora" (a loja avisando a si mesma), então a Meta exige um **template pré-aprovado** (não dá pra mandar texto livre). Passos, todos fora deste repositório:

1. Criar um app em [developers.facebook.com](https://developers.facebook.com), tipo "Negócios", e adicionar o produto **WhatsApp**.
2. Registrar um número na Cloud API — pode ser um número novo só pra isso, ou migrar um que você já usa (nesse caso ele sai do WhatsApp Business App comum e passa a só funcionar pela API).
3. Verificar o negócio no Meta Business Manager (sem isso o número fica com limite baixo de mensagens/dia).
4. Gerar um token permanente via **System User** (o token temporário que a Meta dá de início expira em 24h — não serve pra produção).
5. Criar um **template de mensagem** (Meta Business Manager → WhatsApp Manager → Templates), categoria "Utilidade", com um único parâmetro de texto no corpo — ex: nome `novo_pedido`, corpo `"{{1}}"` ou `"Novo pedido no site: {{1}}"`. Aguardar aprovação (geralmente rápida pra templates simples de utilidade).
6. Configurar as 4 variáveis `WHATSAPP_*` da tabela acima na Vercel.

⚠️ O aviso de **Pix pago** (`api/webhook.js`) ainda não foi testado contra uma notificação real — o `type` da query string e o `status` retornado por `GET /v1/payments/{id}` para um pagamento criado via API de Orders precisam ser conferidos no primeiro teste de verdade (ver comentário no topo do arquivo). O aviso de **cartão aprovado** (`api/create-order.js`) usa o mesmo fluxo já testado do resto da integração de pagamento.

Sem essas variáveis configuradas, nada quebra — a notificação é só pulada (loga um aviso nos logs da Vercel) e o pagamento continua funcionando normalmente.

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
