/* ==========================================================================
   FuiEuQueFiz — products.js
   Plain global product catalog data + shared helpers. No ES modules —
   loaded as a classic <script> before catalog.js / product-page.js / cart.js
   on every page that needs it.
   ========================================================================== */

const PRODUCTS = [
  { slug:"mesa-de-jantar-vigamestra", name:"Mesa de Jantar Vigamestra", category:"Mesas", price:8900,
    image:"assets/products/mesa-de-jantar-vigamestra.jpg",
    short:"Mesa de jantar para até 10 lugares, tampo inteiriço em madeira de lei e base em viga de ferro tipo I.",
    description:"Inspirada nas vigas estruturais de galpões industriais, a Vigamestra tem tampo maciço em peroba ou freijó (conforme disponibilidade) e base soldada e forjada à mão em ferro tipo I. Uma peça central, feita para durar gerações.",
    materials:"Madeira de lei maciça (peroba ou freijó de reflorestamento certificado) + base em ferro tipo I",
    dimensions:"220 × 76 × 100 cm (C×A×L) — sob medida disponível", leadTime:"6 a 8 semanas",
    sizeVariants:[{label:"6 lugares",priceDelta:-1800},{label:"8 lugares",priceDelta:0},{label:"10 lugares",priceDelta:1600}] },
  { slug:"mesa-de-centro-tronco-cru", name:"Mesa de Centro Tronco Cru", category:"Mesas", price:3200,
    short:"Tronco maciço inteiriço, cortado e curado, sobre pés triangulares em chapa de ferro preto.",
    description:"Cada tronco é único — veios, nós e rachaduras naturais fazem parte do desenho. Curado por semanas antes do corte final e da montagem sobre pés triangulares em ferro chapa preta.",
    materials:"Tronco de madeira maciça (reaproveitamento) + pés em chapa de ferro preto",
    dimensions:"90 × 40 × 55 cm", leadTime:"4 a 6 semanas (peça única, sujeita à disponibilidade do tronco)" },
  { slug:"mesa-lateral-rebite", name:"Mesa Lateral Rebite", category:"Mesas", price:1450,
    short:"Mesa lateral compacta com tampo em madeira de lei e estrutura em aço corten rebitado.",
    description:"Detalhes de rebite aparente remetem à marcenaria industrial de ferrovias. Ideal ao lado de poltronas e sofás.",
    materials:"Aço corten + madeira de lei maciça", dimensions:"45 × 55 × 45 cm", leadTime:"3 a 4 semanas" },
  { slug:"cadeira-forja-alta", name:"Cadeira Forja Alta", category:"Cadeiras & Poltronas", price:1290,
    short:"Estrutura em ferro forjado à mão, assento e encosto em couro cru envelhecido. Vendida por unidade.",
    description:"Vendida por unidade. Estrutura soldada e forjada artesanalmente, com assento em couro cru que ganha pátina única com o uso.",
    materials:"Ferro forjado + couro cru", dimensions:"46 × 92 × 52 cm", leadTime:"5 a 7 semanas" },
  { slug:"cadeira-serraria", name:"Cadeira Serraria", category:"Cadeiras & Poltronas", price:980,
    short:"Cadeira robusta em madeira maciça com encosto em lona encerada.",
    description:"Linhas retas, montagem sem parafusos aparentes, encosto em lona encerada resistente à umidade.",
    materials:"Madeira maciça + lona encerada", dimensions:"44 × 88 × 50 cm", leadTime:"4 a 5 semanas" },
  { slug:"poltrona-fundicao", name:"Poltrona Fundição", category:"Cadeiras & Poltronas", price:4100,
    image:"assets/products/poltrona-fundicao.jpg",
    short:"Braços em ferro fundido, estofado em linho rústico de fibra natural.",
    description:"Uma poltrona de estar com presença — base e braços em ferro fundido texturizado, estofamento em linho rústico costurado à mão.",
    materials:"Ferro fundido + linho rústico + espuma D33", dimensions:"78 × 84 × 82 cm", leadTime:"6 a 8 semanas" },
  { slug:"banqueta-oficina", name:"Banqueta Oficina", category:"Cadeiras & Poltronas", price:890,
    short:"Banqueta giratória com base tripé em ferro, inspirada em bancos de oficina mecânica.",
    description:"Altura ajustável, base tripé estável em ferro pintado, assento em madeira maciça torneada.",
    materials:"Ferro + madeira maciça", dimensions:"40 × 62–78 × 40 cm", leadTime:"3 a 4 semanas" },
  { slug:"banco-trilho", name:"Banco Trilho", category:"Cadeiras & Poltronas", price:2450,
    short:"Banco longo em dormente de trem reaproveitado, para até 3 lugares.",
    description:"Feito a partir de dormentes de ferrovia recuperados — madeira densa, marcada pelo tempo, com história própria.",
    materials:"Dormente de madeira reaproveitado", dimensions:"150 × 45 × 35 cm", leadTime:"4 a 6 semanas (sujeito à disponibilidade do material)" },
  { slug:"estante-andaime", name:"Estante Andaime", category:"Estantes & Racks", price:5600,
    image:"assets/products/estante-andaime.jpg",
    short:"Módulos empilháveis inspirados em andaimes de obra, estrutura em ferro tubular e prateleiras de madeira.",
    description:"Sistema modular — comece com três módulos e expanda depois. Estrutura em ferro tubular soldado, prateleiras em madeira maciça.",
    materials:"Ferro tubular + madeira maciça", dimensions:"90 × 180 × 35 cm (módulo padrão, 3 níveis)", leadTime:"5 a 7 semanas" },
  { slug:"estante-container", name:"Estante Contêiner", category:"Estantes & Racks", price:6300,
    short:"Estrutura vazada em aço patinado inspirada em contêineres industriais, com prateleiras em madeira maciça.",
    description:"Um marco visual para salas de estar e escritórios — vazada, robusta, com pátina proposital no aço.",
    materials:"Aço patinado + madeira maciça", dimensions:"120 × 200 × 40 cm", leadTime:"6 a 8 semanas" },
  { slug:"aparador-fabrica", name:"Aparador Fábrica", category:"Aparadores", price:3750,
    image:"assets/products/aparador-fabrica.jpg",
    short:"Aparador baixo com portas em ferro perfurado, estilo grade industrial.",
    description:"Portas em chapa de ferro perfurado, tampo em madeira maciça, ótimo para salas de jantar e halls de entrada.",
    materials:"Ferro perfurado + madeira maciça", dimensions:"140 × 75 × 42 cm", leadTime:"5 a 6 semanas" },
  { slug:"rack-painel-galpao", name:"Rack Painel Galpão", category:"Estantes & Racks", price:4950,
    short:"Painel para TV com textura de portão de galpão antigo e nichos em ferro.",
    description:"Painel de destaque com ripas de madeira maciça recuperada e nichos estruturados em ferro preto fosco.",
    materials:"Madeira maciça reaproveitada + ferro preto fosco", dimensions:"220 × 45 × 40 cm", leadTime:"6 a 7 semanas" },
  { slug:"cabeceira-trave", name:"Cabeceira Trave", category:"Sob encomenda", price:3100,
    short:"Cabeceira de cama em viga de madeira maciça inteiriça.",
    description:"Uma única viga maciça, lixada e tratada, disponível para camas queen e king.",
    materials:"Viga de madeira maciça (reflorestamento certificado)", dimensions:"160–193 × 110 × 12 cm", leadTime:"4 a 6 semanas",
    sizeVariants:[{label:"Queen (160cm)",priceDelta:0},{label:"King (193cm)",priceDelta:450}] },
  { slug:"escrivaninha-bancada", name:"Escrivaninha Bancada", category:"Sob encomenda", price:3400,
    short:"Escrivaninha inspirada em bancada de marceneiro reaproveitada, pés em ferro.",
    description:"Tampo espesso com marcas naturais de uso, remetendo a uma verdadeira bancada de oficina, sobre pés em ferro soldado.",
    materials:"Madeira maciça reaproveitada + ferro", dimensions:"140 × 75 × 65 cm", leadTime:"5 a 6 semanas" },
  { slug:"bancada-de-bar-fundicao", name:"Bancada de Bar Fundição", category:"Aparadores", price:7200,
    short:"Bancada alta para até 4 banquetas, tampo em madeira de lei e base em ferro fundido.",
    description:"Pensada para cozinhas americanas e áreas gourmet — tampo espesso em madeira de lei sobre base robusta em ferro fundido.",
    materials:"Madeira de lei + ferro fundido", dimensions:"180 × 105 × 60 cm", leadTime:"7 a 9 semanas" },
  { slug:"espelho-portal", name:"Espelho Portal", category:"Decoração", price:1680,
    short:"Espelho com moldura em ferro envelhecido, formato arco industrial.",
    description:"Moldura soldada à mão em ferro com acabamento envelhecido, formato de arco/portal inspirado em vãos de galpão.",
    materials:"Ferro envelhecido + espelho", dimensions:"80 × 180 cm", leadTime:"3 a 5 semanas" },
  { slug:"luminaria-pendente-farol", name:"Luminária Pendente Farol", category:"Iluminação", price:780,
    short:"Pendente estilo farol ferroviário, corpo em ferro preto fosco.",
    description:"Um clássico industrial revisitado — corpo em ferro preto fosco, cabo têxtil trançado, compatível com lâmpadas E27.",
    materials:"Ferro preto fosco + cabo têxtil", dimensions:"26 × 30 cm (Ø × A)", leadTime:"2 a 3 semanas" },
  { slug:"luminaria-de-chao-trilho", name:"Luminária de Chão Trilho", category:"Iluminação", price:1150,
    short:"Coluna em cano industrial preto com base em madeira maciça.",
    description:"Estrutura em cano de ferro preto fosco sobre base maciça em madeira, cúpula em metal perfurado.",
    materials:"Cano de ferro preto + madeira maciça", dimensions:"35 × 165 cm (base × altura)", leadTime:"3 a 4 semanas" },
  { slug:"mesa-de-apoio-dobradica", name:"Mesa de Apoio Dobradiça", category:"Mesas", price:1320,
    short:"Mesa de apoio com tampo articulado por dobradiças aparentes, base em ferro.",
    description:"O tampo se ajusta em ângulo através de dobradiças industriais aparentes — funcional e escultural ao mesmo tempo.",
    materials:"Madeira maciça + ferro", dimensions:"50 × 55 × 50 cm", leadTime:"3 a 4 semanas" },
  { slug:"poltrona-suspensa-corrente", name:"Poltrona Suspensa Corrente", category:"Cadeiras & Poltronas", price:3900,
    short:"Poltrona suspensa por correntes de aço, estrutura própria em madeira maciça (não requer fixação no teto).",
    description:"Suspensa por correntes de aço fixadas em estrutura própria de madeira maciça — não requer fixação no teto. Almofadas em tecido outdoor resistente.",
    materials:"Madeira maciça + correntes de aço + tecido outdoor", dimensions:"90 × 190 × 90 cm (estrutura completa)", leadTime:"6 a 8 semanas" },

  /* ---- Peças reais do ateliê, com fotografia própria (não placeholder) ---- */
  { slug:"tabua-jarro-decorativa", name:"Tábua Decorativa Jarro", category:"Decoração", price:420,
    image:"assets/products/tabua-jarro-decorativa.jpg",
    short:"Tábua/travessa decorativa esculpida em fatia única de tronco, silhueta de jarro.",
    description:"Peça única, esculpida a partir de uma fatia inteiriça de tronco, com recorte em silhueta de jarro e alça vazada. Serve como travessa decorativa ou peça de parede — os anéis de crescimento e as rachaduras naturais da madeira fazem parte do desenho, então cada unidade é exclusiva.",
    materials:"Madeira maciça em fatia única (peça exclusiva, sem reposição idêntica)",
    dimensions:"Aprox. 45 × 65 cm (varia por peça, é natural/única)", leadTime:"Pronta entrega — peça única disponível" },
  { slug:"relogio-fatia-de-tronco", name:"Relógio de Parede Fatia de Tronco", category:"Decoração", price:890,
    image:"assets/products/relogio-fatia-de-tronco.jpg",
    short:"Relógio de parede em fatia de tronco com nós e cavidades naturais preservadas.",
    description:"Cada relógio nasce de uma fatia de tronco única — nós, cavidades e a textura crua da casca ficam à mostra, e o maquinário fica embutido de forma discreta. Peça de parede que também funciona como escultura.",
    materials:"Fatia de tronco maciça + maquinário de relógio silencioso",
    dimensions:"Aprox. 35 × 40 cm (varia por peça)", leadTime:"Pronta entrega — peça única disponível" },
  { slug:"adega-galho-de-arvore", name:"Adega Galho de Árvore", category:"Decoração", price:650,
    image:"assets/products/adega-galho-de-arvore.jpg",
    short:"Adega escultural para até 7 garrafas, feita a partir de um galho natural.",
    description:"Um galho selecionado pela forma de suas bifurcações naturais vira suporte para até 7 garrafas de vinho, montado sobre base circular em metal. Cada adega é única — a disposição das garrafas segue a forma do próprio galho.",
    materials:"Galho de madeira maciça + base em metal",
    dimensions:"Aprox. 30 × 75 × 30 cm (varia por peça)", leadTime:"Pronta entrega — peça única disponível" },
  { slug:"console-prateleira-aberta", name:"Console Prateleira Aberta", category:"Aparadores", price:1980,
    image:"assets/products/console-prateleira-aberta.jpg",
    short:"Console/aparador com tampo em madeira maciça e prateleira inferior, base em ferro preto.",
    description:"Linhas retas, tampo espesso em madeira maciça e prateleira inferior aberta em madeira, sobre estrutura soldada em ferro preto fosco. Ideal para hall de entrada ou atrás do sofá.",
    materials:"Madeira maciça + ferro preto fosco", dimensions:"120 × 80 × 35 cm", leadTime:"4 a 5 semanas" },
  { slug:"console-estreito-industrial", name:"Console Estreito Industrial", category:"Aparadores", price:1650,
    image:"assets/products/console-estreito-industrial.jpg",
    short:"Console estreito e alongado, tampo em madeira maciça e pés trapezoidais em ferro.",
    description:"Formato estreito e comprido pensado para corredores e vãos apertados — tampo em madeira maciça envernizada sobre pés trapezoidais em ferro preto fosco.",
    materials:"Madeira maciça + ferro preto fosco", dimensions:"180 × 75 × 20 cm", leadTime:"4 a 5 semanas" },
  { slug:"mesa-de-centro-com-lareira", name:"Mesa de Centro com Lareira", category:"Mesas", price:4900,
    image:"assets/products/mesa-de-centro-com-lareira.jpg",
    short:"Mesa de centro em fatia de tronco maciço com lareira de mesa embutida (a etanol).",
    description:"Tronco maciço de borda natural com uma lareira de mesa a etanol embutida no centro — casca preservada, formato orgânico único, acabamento em verniz de alto brilho. Uma peça-conversa para a sala.",
    materials:"Tronco de madeira maciça + queimador de etanol embutido em aço",
    dimensions:"Aprox. 100 × 25 × 70 cm (varia por peça, formato natural)", leadTime:"Pronta entrega — peça única disponível" },
  { slug:"banco-industrial-chevron", name:"Banco Industrial Chevron", category:"Cadeiras & Poltronas", price:2200,
    image:"assets/products/banco-industrial-chevron.jpg",
    short:"Banco longo com encosto assimétrico e lateral vazada em recortes chevron, estrutura em ferro.",
    description:"Assento em réguas de madeira maciça sobre estrutura soldada em ferro preto, com encosto assimétrico e uma lateral escultural em recortes chevron aninhados. Acabamento em pintura eletrostática.",
    materials:"Madeira maciça + ferro com pintura eletrostática preta", dimensions:"160 × 75 × 40 cm", leadTime:"5 a 6 semanas" },
  { slug:"trio-de-pedestais", name:"Trio de Pedestais Decorativos", category:"Decoração", price:980,
    image:"assets/products/trio-de-pedestais.jpg",
    short:"Conjunto de 3 pedestais em alturas diferentes, madeira maciça e ferro preto.",
    description:"Três colunas vazadas de alturas escalonadas, blocos de madeira maciça encaixados em estrutura de ferro preto. Vendidos em conjunto — para plantas, velas ou garrafas em composição decorativa.",
    materials:"Madeira maciça + ferro preto fosco", dimensions:"Alturas: 80 / 65 / 50 cm (base 20×20 cm)", leadTime:"3 a 4 semanas" },

  { slug:"par-mesas-fatia-de-tronco", name:"Par de Mesas Empilháveis Fatia de Tronco", category:"Mesas", price:1780,
    image:"assets/products/par-mesas-fatia-de-tronco.png",
    short:"Duas mesas laterais em fatia de tronco maciço, alturas diferentes, pernas em ferro hairpin.",
    description:"Duas fatias de tronco maciço, uma menor que a outra, cada uma sobre pernas finas em ferro hairpin — se encaixam lado a lado ou uma sob a outra, conforme o espaço. Vendidas em par.",
    materials:"Fatia de tronco maciça + pernas hairpin em ferro",
    dimensions:"Maior 45×40cm / menor 35×30cm (Ø×A, varia por peça)", leadTime:"4 a 5 semanas" },
  { slug:"banco-ferro-a", name:"Banco Ferro A", category:"Cadeiras & Poltronas", price:1450,
    image:"assets/products/banco-ferro-a.png",
    short:"Banco com assento e encosto em fatia de madeira maciça sobre pernas em \"A\" de aço preto.",
    description:"Estrutura geométrica em aço preto fosco, formato de \"A\" que dá estabilidade sem pesar visualmente. Assento e encosto em fatia de madeira maciça com borda natural preservada.",
    materials:"Madeira maciça + aço preto fosco", dimensions:"150 × 80 × 45 cm", leadTime:"4 a 5 semanas" },
  { slug:"estante-modular-geometrica", name:"Estante Modular Geométrica", category:"Estantes & Racks", price:3600,
    image:"assets/products/estante-modular-geometrica.png",
    short:"Estante modular em ferro preto com compartimentos assimétricos e prateleiras em madeira.",
    description:"Módulos de tamanhos e alturas diferentes se combinam numa estrutura só, em ferro preto fosco, com prateleiras em madeira — parte estante, parte escultura de parede.",
    materials:"Ferro preto fosco + madeira maciça", dimensions:"90 × 200 × 40 cm", leadTime:"6 a 7 semanas" },
  { slug:"rack-ripas-verticais", name:"Rack Ripas Verticais", category:"Estantes & Racks", price:2950,
    image:"assets/products/rack-ripas-verticais.png",
    short:"Rack de TV com estrutura em ripas verticais de ferro preto, tampo e gaveteiro em madeira.",
    description:"Ripas verticais de ferro preto formam uma \"gaiola\" ao redor do móvel, com tampo em madeira e gaveteiro com puxadores discretos.",
    materials:"Ferro preto fosco + madeira maciça", dimensions:"160 × 45 × 40 cm", leadTime:"5 a 6 semanas" },
  { slug:"banco-patio-ripado", name:"Banco Pátio Ripado", category:"Cadeiras & Poltronas", price:1680,
    image:"assets/products/banco-patio-ripado.jpg",
    short:"Banco com encosto e assento em ripas de madeira sobre estrutura vazada em ferro preto.",
    description:"Ripas de madeira maciça formam o assento e o encosto, presas a uma estrutura vazada em ferro preto fosco — resistente o suficiente para área externa, elegante o suficiente para dentro de casa.",
    materials:"Madeira maciça + ferro preto fosco", dimensions:"150 × 85 × 55 cm", leadTime:"4 a 5 semanas" },
  { slug:"aparador-bar-escada", name:"Aparador Bar Escada", category:"Aparadores", price:3450,
    image:"assets/products/aparador-bar-escada.png",
    short:"Aparador bar com portas em madeira maciça e prateleira superior em formato de escada, estrutura em ferro preto.",
    description:"Aparador com portas em madeira maciça e uma prateleira superior inclinada, estilo escada, em ferro preto — feito para expor garrafas e copos, com espaço fechado para guardar o resto.",
    materials:"Madeira maciça + ferro preto fosco", dimensions:"150 × 170 × 45 cm", leadTime:"6 a 7 semanas" }
];

/* ==========================================================================
   Categories — de-duplicated in first-appearance order, "Todos" prepended.
   Used to build the catalog filter pills.
   ========================================================================== */
const CATEGORIES = ["Todos"].concat(
  PRODUCTS.map(function (p) { return p.category; }).filter(function (cat, i, arr) {
    return arr.indexOf(cat) === i;
  })
);

/* ==========================================================================
   formatBRL — "R$ 8.900" (no decimals, Brazilian thousands separator)
   ========================================================================== */
function formatBRL(value) {
  return "R$ " + Math.round(value).toLocaleString("pt-BR");
}

/* Same as formatBRL but signed, for size-variant price deltas: "+R$ 450" / "-R$ 1.800" */
function formatBRLDelta(value) {
  var sign = value < 0 ? "-" : "+";
  return sign + formatBRL(Math.abs(value));
}

/* ==========================================================================
   getShotGradient — deterministic palette-cycling for the .product-shot
   placeholder background. 6 warm gradient pairs composed only from tokens
   already in the system (--color-dark-1, --color-dark-3, #5C4630, #3A2E22,
   #6B4A30, --color-action, --color-action-on-dark), matching the visual
   language of the stage-6 SVG illustration and the homepage featured cards.
   Returns a class name to apply alongside .product-shot.
   ========================================================================== */
var SHOT_GRADIENT_CLASSES = [
  "shot-grad-1",
  "shot-grad-2",
  "shot-grad-3",
  "shot-grad-4",
  "shot-grad-5",
  "shot-grad-6"
];

function getShotGradient(index) {
  var i = ((index % SHOT_GRADIENT_CLASSES.length) + SHOT_GRADIENT_CLASSES.length) % SHOT_GRADIENT_CLASSES.length;
  return SHOT_GRADIENT_CLASSES[i];
}

/* ==========================================================================
   productShotHTML — shared markup for the inner content of a `.product-shot`
   container (used by catalog.js and product-page.js). If the product has a
   real `image`, renders an <img>; otherwise falls back to the CSS-gradient
   placeholder + artistic-preview note. Returns HTML string only — the
   caller still wraps it in `<div class="product-shot ...">`.
   ========================================================================== */
function productShotHTML(product, index) {
  if (product.image) {
    return '<img src="' + product.image + '" alt="' + product.name + '" loading="lazy">';
  }
  return (
    '<span class="product-shot-mark">' + product.name + '</span>' +
    '<span class="product-shot-note">Prévia artística — fotos reais em breve</span>'
  );
}

/* Returns the full class list for the .product-shot wrapper: gradient class
   is only needed (and only applied) when there's no real photo. */
function productShotClass(product, index) {
  return product.image ? "" : " " + getShotGradient(index);
}

/* ==========================================================================
   getFinishGroups — derives selectable finish chip groups from a product's
   free-text `materials` field. Not hardcoded per-product.
   ========================================================================== */
function getFinishGroups(product) {
  var groups = [];
  var materials = (product.materials || "").toLowerCase();

  if (materials.indexOf("ferro") !== -1 || materials.indexOf("aço") !== -1) {
    groups.push({ group: "Acabamento do metal", options: ["Preto fosco", "Ferrugem selada"] });
  }

  if (materials.indexOf("madeira") !== -1) {
    groups.push({ group: "Tom da madeira", options: ["Natural", "Tabaco", "Ébano"] });
  }

  return groups;
}
