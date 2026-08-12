# Prompts para Higgsfield — FuiEuQueFiz

Este arquivo reúne prompts prontos para colar no Higgsfield (ou ferramenta de geração de vídeo/imagem por IA equivalente) para produzir a fotografia e o vídeo reais que devem, no futuro, substituir os placeholders visuais atuais do site.

**Atualização:** o vídeo hero de rolagem (Parte A) já foi gerado no Higgsfield e está integrado no site — ver status abaixo. Os 20 produtos (Parte B) ainda usam gradientes de CSS (`.product-shot` + `getShotGradient()` em `js/products.js`) como espaço reservado; essa parte continua pendente. Ver `README.md`, seção "Antes de vender de verdade", para o passo a passo de como plugar novas fotos de volta no site depois de geradas.

---

## Parte A — Vídeo hero de rolagem ("revelação sob a luz") — ✅ já gerado e integrado

### Status atual (v3 — revelação por luz da mesa principal, câmera travada)

A seção passou por três conceitos:
1. **v0 (arquivado):** "a árvore vira móvel", 6 estágios em SVG ilustrado à mão.
2. **v1 (arquivado):** bolacha de madeira em loop — anéis se separavam, giravam e voltavam sozinhos dentro do próprio vídeo.
3. **v2 (arquivado):** bolacha de madeira em vista explodida, câmera travada, separação em Z sem rotação, sentido único.
4. **v3 (atual):** o pedido do cliente foi abandonar de vez o conceito da bolacha de madeira e criar algo com "cara de alto padrão que atraia clientes", mantendo a mesma mecânica de scroll. A solução: em vez de um objeto abstrato (madeira), o vídeo mostra a **peça-carro-chefe do catálogo** — a Mesa de Jantar Vigamestra (tampo de madeira maciça + base em ferro I forjado) — quase no escuro, e conforme o usuário rola a página, uma luz quente varre a peça revelando progressivamente o grão da madeira e a solda do ferro, até a composição final: a mesa totalmente iluminada, em enquadramento de fotografia de produto de luxo (o mesmo tipo de reveal usado em anúncios de carro/relógio de alto padrão). É publicidade direta do produto, não uma metáfora — decisão deliberada para "atrair clientes" em vez de apenas ilustrar um conceito de marca.

Arquitetura de scroll: idêntica às versões anteriores. Câmera 100% travada, vídeo de **mão única** (escuro → totalmente revelado); o "voltar ao escuro" não está gravado — acontece porque `js/scroll-morph.js` faz `video.currentTime` recuar quando o usuário rola para cima, tocando a mesma filmagem de trás para frente. Nenhuma mudança de lógica em `scroll-morph.js` foi necessária entre v1/v2/v3 além do texto das legendas — o binding `video.currentTime = progress * video.duration` é genérico.

Arquivos (v3, atual):
- Imagem-base (still, usada como `end_image` — o frame final/totalmente revelado): modelo `nano_banana_pro` (resolvido para `nano_banana_2`), 2K, 16:9.
- Vídeo: modelo `seedance_2_0`, modo `std`, 720p, 16:9, 6s, sem áudio, apenas `end_image` (sem `start_image` — o modelo constrói o início escuro a partir do prompt de movimento).
- `assets/scroll-video/mesa-reveal.mp4` (vídeo atual) + `assets/scroll-video/mesa-reveal-poster.png` (still/poster — igual ao frame final, então também serve como imagem estática de fallback para `prefers-reduced-motion`).
- Vídeos das versões anteriores mantidos no projeto (`assets/scroll-video/anel-madeira.mp4` = v2, `assets/scroll-video/anel-madeira-loop-v1.mp4` = v1) caso queiram reaproveitar o conceito de bolacha de madeira em outra seção do site (ex.: dentro de `sobre.html#madeira`, como ilustração complementar da história de sustentabilidade).
- CSS: `.morph-video` mudou de `aspect-ratio: 1/1` para `aspect-ratio: 16/9` e `.morph-illustration` ficou mais largo (`min(88vw, 980px)`) para acomodar o enquadramento horizontal de uma mesa de jantar sem cortar as pontas.

### Prompts usados na v3

**Still (end frame — a peça totalmente revelada, também usada como poster do vídeo):**
> "Photorealistic high-end product photography of a rustic-industrial dining table: a thick solid hardwood tabletop with rich warm honey-to-walnut wood grain, visible natural knots and imperfections, resting on a robust black wrought-iron I-beam base with hand-forged welded joinery. Locked frontal three-quarter view, dramatic moody studio lighting with a single warm raking key light from the upper left and soft fill, deep near-black background fading into soft shadow, cinematic high contrast, premium furniture advertising aesthetic, ultra sharp macro detail on the wood grain and the iron weld seams, table in perfect sharp focus, shallow depth of field on the background, luxury editorial furniture photography. No people, no text, no logos, no props, no busy background, no other furniture."

**Vídeo (motion, apenas `end_image`, sem `start_image`):**
> "Locked-off, completely static camera, no zoom, no pan, no rotation, no parallax. A rustic-industrial dining table with a thick solid hardwood top and a black wrought-iron I-beam base sits in near-total darkness at the start of the shot, only the faintest outline of its silhouette visible against a deep black background. Over the course of the shot, a single warm raking key light gradually rises in intensity and sweeps slowly across the piece from the upper left, progressively revealing the rich wood grain texture, natural knots, and the hand-forged welded joinery of the iron base in increasing detail and contrast. The reveal is smooth, continuous and linear, building steadily toward a fully and dramatically lit final composition where the entire table is beautifully illuminated in sharp macro detail, exactly matching a premium editorial furniture-advertising hero shot. No camera movement of any kind, no cuts, no other objects entering frame, no people, no hands, no text, no logos, no particles, no smoke, cinematic and precise, luxury product commercial mood."

### Como regenerar em maior qualidade / com outra peça (produção)

O vídeo v3 atual está em 720p/6s como teste de conceito validado — funciona bem, mas para produção considere:
1. Regenerar em `resolution: "1080p"` ou `"4k"` para mais nitidez no grão da madeira e na solda do ferro (confirme saldo com `balance` antes — o custo sobe bastante com resolução/duração).
2. Rodar o vídeo final por `ffmpeg -movflags faststart` (não disponível nesta máquina no momento da geração) para o scroll-scrubbing via `video.currentTime` ficar mais responsivo em conexões mais lentas.
3. O mesmo padrão de prompt (câmera travada + still final como `end_image` + "reveal por luz a partir do escuro") funciona para qualquer peça do catálogo — pode trocar a Mesa de Jantar Vigamestra por outra peça-destaque (ex.: a Poltrona Fundição ou a Estante Andaime) gerando uma nova still com o mesmo template de iluminação e repetindo o prompt de vídeo trocando só a descrição do objeto.
4. Essa mesma técnica (still de produto de alta qualidade + vídeo de "reveal" por luz) também é uma boa forma de gerar as 20 fotos de produto da Parte B abaixo — a still já gerada aqui (`mesa-reveal-poster.png`) é, na prática, uma foto de produto real da Mesa de Jantar Vigamestra e pode ser usada em `assets/products/mesa-de-jantar-vigamestra.jpg` seguindo o passo (c) do `README.md`.

---

## Parte B — As 20 fotos de produto

### Template compartilhado (aplica-se a todas as 20 fotos)

**Setup de estúdio:** luz difusa suave (softbox key + fill), sem sombras duras, fundo limpo e neutro adequado para recorte/transparência (fundo cinza-claro ou bege-claro liso), ângulo consistente de 3/4 por categoria de produto (mesas e aparadores fotografados de um ângulo elevado de 3/4; cadeiras, poltronas e luminárias de um 3/4 frontal na altura dos olhos).

**Formatos de saída por produto:**
- Corte quadrado 1:1 (para o grid do catálogo).
- Alternativa 4:3 (para o hero da página de produto).
- Resolução ≥ 3000px no lado maior, em ambos os formatos.

**Prompt negativo (aplicar em todas as gerações):** no people, no text, no watermark, no logos, busy or cluttered background, warped or distorted geometry, low resolution, blurry, out of focus, extra limbs, unrealistic proportions.

### As 20 peças (nome → prompt)

| # | Produto (slug) | Prompt |
|---|---|---|
| 1 | Mesa de Jantar Vigamestra (`mesa-de-jantar-vigamestra`) | Studio product photo of a large rustic-industrial dining table for up to 10 people, solid hardwood tabletop (peroba or freijó), base built from a welded and hand-forged black iron I-beam, warm wood grain visible, soft diffuse studio lighting, clean neutral background, 3/4 elevated angle. |
| 2 | Mesa de Centro Tronco Cru (`mesa-de-centro-tronco-cru`) | Studio product photo of a rustic coffee table made from a single solid raw tree trunk section, natural bark-edge silhouette with visible grain, cracks and knots, resting on triangular black sheet-iron legs, soft diffuse studio lighting, clean neutral background, 3/4 elevated angle. |
| 3 | Mesa Lateral Rebite (`mesa-lateral-rebite`) | Studio product photo of a compact rustic-industrial side table, solid hardwood top on a riveted corten steel frame with visible rivet details, warm rusted-orange metal tone, soft diffuse studio lighting, clean neutral background, 3/4 elevated angle. |
| 4 | Cadeira Forja Alta (`cadeira-forja-alta`) | Studio product photo of a tall rustic-industrial chair, hand-forged black iron frame, raw aged leather seat and backrest with natural patina, soft diffuse studio lighting, clean neutral background, 3/4 eye-level angle. |
| 5 | Cadeira Serraria (`cadeira-serraria`) | Studio product photo of a sturdy rustic wooden chair, solid hardwood frame with clean straight lines and no visible screws, backrest in weatherproof waxed canvas, soft diffuse studio lighting, clean neutral background, 3/4 eye-level angle. |
| 6 | Poltrona Fundição (`poltrona-fundicao`) | Studio product photo of a statement lounge armchair, textured cast-iron arms and base, hand-stitched rustic natural linen upholstery, soft diffuse studio lighting, clean neutral background, 3/4 eye-level angle. |
| 7 | Banqueta Oficina (`banqueta-oficina`) | Studio product photo of a swivel workshop stool inspired by mechanic's shop seating, adjustable-height black iron tripod base, turned solid wood seat, soft diffuse studio lighting, clean neutral background, 3/4 eye-level angle. |
| 8 | Banco Trilho (`banco-trilho`) | Studio product photo of a long rustic bench for up to three people, made from a reclaimed railway sleeper with weathered, time-marked solid wood, minimal visible support legs, soft diffuse studio lighting, clean neutral background, 3/4 elevated angle. |
| 9 | Estante Andaime (`estante-andaime`) | Studio product photo of a modular industrial shelving unit inspired by construction scaffolding, welded black tubular iron structure, solid wood shelves, three stacked levels, soft diffuse studio lighting, clean neutral background, 3/4 elevated angle. |
| 10 | Estante Contêiner (`estante-container`) | Studio product photo of a tall open-frame shelving unit inspired by industrial shipping containers, patinated weathered steel frame, solid wood shelves, soft diffuse studio lighting, clean neutral background, 3/4 elevated angle. |
| 11 | Aparador Fábrica (`aparador-fabrica`) | Studio product photo of a low rustic-industrial sideboard, perforated black iron grille doors, solid wood top, factory-inspired detailing, soft diffuse studio lighting, clean neutral background, 3/4 elevated angle. |
| 12 | Rack Painel Galpão (`rack-painel-galpao`) | Studio product photo of a large TV panel unit with reclaimed solid wood slats textured like an old warehouse gate, matte black iron shelf niches, soft diffuse studio lighting, clean neutral background, 3/4 elevated angle. |
| 13 | Cabeceira Trave (`cabeceira-trave`) | Studio product photo of a bed headboard made from a single solid certified-reforestation wood beam, sanded and treated, warm natural wood tone, soft diffuse studio lighting, clean neutral background, straight-on 3/4 angle. |
| 14 | Escrivaninha Bancada (`escrivaninha-bancada`) | Studio product photo of a rustic writing desk inspired by a reclaimed carpenter's workbench, thick solid reclaimed wood top with natural use marks, welded black iron legs, soft diffuse studio lighting, clean neutral background, 3/4 elevated angle. |
| 15 | Bancada de Bar Fundição (`bancada-de-bar-fundicao`) | Studio product photo of a tall bar counter for up to four stools, thick solid hardwood top on a robust cast-iron base, soft diffuse studio lighting, clean neutral background, 3/4 elevated angle. |
| 16 | Espelho Portal (`espelho-portal`) | Studio product photo of a tall arch-shaped wall mirror, hand-welded aged iron frame with warehouse-portal-inspired silhouette, soft diffuse studio lighting, clean neutral background, straight-on angle. |
| 17 | Luminária Pendente Farol (`luminaria-pendente-farol`) | Studio product photo of a railway-lantern-style pendant light, matte black iron body, braided textile cable, industrial vintage silhouette, soft diffuse studio lighting, clean neutral background, 3/4 angle. |
| 18 | Luminária de Chão Trilho (`luminaria-de-chao-trilho`) | Studio product photo of a tall floor lamp, matte black industrial pipe column on a solid wood base, perforated metal shade, soft diffuse studio lighting, clean neutral background, 3/4 angle. |
| 19 | Mesa de Apoio Dobradiça (`mesa-de-apoio-dobradica`) | Studio product photo of a small rustic-industrial side table with a hinged tabletop that adjusts angle via exposed industrial hinges, solid wood top, black iron base, soft diffuse studio lighting, clean neutral background, 3/4 elevated angle. |
| 20 | Poltrona Suspensa Corrente (`poltrona-suspensa-corrente`) | Studio product photo of an armchair suspended by steel chains from its own free-standing solid wood frame (no ceiling mount required), durable outdoor-grade fabric cushions, soft diffuse studio lighting, clean neutral background, 3/4 elevated angle. |

---

*Este arquivo é um briefing prático, não um contrato — ajuste os prompts conforme os resultados reais do Higgsfield forem chegando. O importante é manter a coerência de luz, paleta e enquadramento entre as 20 fotos e o vídeo, já que todos aparecerão lado a lado no mesmo site.*
