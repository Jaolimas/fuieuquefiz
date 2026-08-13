/* ==========================================================================
   FuiEuQueFiz — products.js
   Plain global product catalog data + shared helpers. No ES modules —
   loaded as a classic <script> before catalog.js / product-page.js / cart.js
   on every page that needs it.
   ========================================================================== */

const PRODUCTS = [
  { slug:"mesa-de-centro-com-lareira", name:"Mesa de Centro com Lareira", category:"Mesas", price:2000,
    image:"assets/products/mesa-de-centro-com-lareira.png",
    short:"Mesa de centro em fatia de tronco maciço com lareira de mesa embutida (a etanol).",
    description:"Tronco maciço de borda natural com uma lareira de mesa a etanol embutida no centro — casca preservada, formato orgânico único, acabamento em verniz de alto brilho. Uma peça-conversa para a sala.",
    materials:"Tronco de madeira maciça + queimador de etanol embutido em aço",
    dimensions:"Aprox. 100 × 25 × 70 cm (varia por peça, formato natural)", leadTime:"Pronta entrega — peça única disponível" },
  { slug:"par-mesas-fatia-de-tronco", name:"Par de Mesas Empilháveis Fatia de Tronco", category:"Mesas", price:1200,
    image:"assets/products/par-mesas-fatia-de-tronco.png",
    short:"Duas mesas laterais em fatia de tronco maciço, alturas diferentes, pernas em ferro hairpin.",
    description:"Duas fatias de tronco maciço, uma menor que a outra, cada uma sobre pernas finas em ferro hairpin — se encaixam lado a lado ou uma sob a outra, conforme o espaço. Vendidas em par.",
    materials:"Fatia de tronco maciça + pernas hairpin em ferro",
    dimensions:"Maior 45×40cm / menor 35×30cm (Ø×A, varia por peça)", leadTime:"4 a 5 semanas" },

  { slug:"banco-ferro-a", name:"Banco Ferro A", category:"Cadeiras & Poltronas", price:2500,
    image:"assets/products/banco-ferro-a.png",
    short:"Banco com assento e encosto em fatia de madeira maciça sobre pernas em \"A\" de aço preto.",
    description:"Estrutura geométrica em aço preto fosco, formato de \"A\" que dá estabilidade sem pesar visualmente. Assento e encosto em fatia de madeira maciça com borda natural preservada.",
    materials:"Madeira maciça + aço preto fosco", dimensions:"150 × 80 × 45 cm", leadTime:"4 a 5 semanas" },
  { slug:"banco-patio-ripado", name:"Banco Pátio Ripado", category:"Cadeiras & Poltronas", price:2800,
    image:"assets/products/banco-patio-ripado.png",
    short:"Banco com encosto e assento em ripas de madeira sobre estrutura vazada em ferro preto.",
    description:"Ripas de madeira maciça formam o assento e o encosto, presas a uma estrutura vazada em ferro preto fosco — resistente o suficiente para área externa, elegante o suficiente para dentro de casa.",
    materials:"Madeira maciça + ferro preto fosco", dimensions:"150 × 85 × 55 cm", leadTime:"4 a 5 semanas" },
  { slug:"banco-duo-mesa-central", name:"Banco Duo com Mesa Central", category:"Cadeiras & Poltronas", price:2500,
    image:"assets/products/banco-duo-mesa-central.png",
    short:"Banco para dois lugares com mesa de apoio central embutida, assento e encosto em réguas de madeira sobre estrutura em ferro preto.",
    description:"Dois assentos emoldurados por um mesmo vão de ferro preto fosco, unidos por uma mesa de apoio central — ideal para jardim, varanda ou sala de estar. Réguas de madeira maciça formam o assento, o encosto e os braços largos, sobre uma estrutura tubular soldada que também serve de apoio para a mesinha.",
    materials:"Madeira maciça + ferro preto fosco (estrutura tubular soldada)",
    dimensions:"180 × 80 × 70 cm (C×A×L, inclui mesa central)", leadTime:"5 a 6 semanas" },

  { slug:"estante-assimetrica-cubos", name:"Estante Assimétrica Cubos", category:"Estantes & Racks", price:1000,
    image:"assets/products/estante-assimetrica-cubos.png",
    short:"Estante de parede em cubos assimétricos escalonados, estrutura em ferro preto e prateleiras em madeira.",
    description:"Módulos em forma de cubo se encaixam em alturas e profundidades diferentes, criando uma composição assimétrica na parede — estrutura soldada em ferro preto fosco, prateleiras em madeira maciça.",
    materials:"Ferro preto fosco + madeira maciça", dimensions:"90 × 210 × 35 cm", leadTime:"6 a 7 semanas" },
  { slug:"estante-modular-geometrica", name:"Estante Modular Geométrica", category:"Estantes & Racks", price:1500,
    image:"assets/products/estante-modular-geometrica.png",
    short:"Estante modular em ferro preto com compartimentos assimétricos e prateleiras em madeira.",
    description:"Módulos de tamanhos e alturas diferentes se combinam numa estrutura só, em ferro preto fosco, com prateleiras em madeira — parte estante, parte escultura de parede.",
    materials:"Ferro preto fosco + madeira maciça", dimensions:"90 × 200 × 40 cm", leadTime:"6 a 7 semanas" },
  { slug:"rack-ripas-verticais", name:"Rack Ripas Verticais", category:"Estantes & Racks", price:2200,
    image:"assets/products/rack-ripas-verticais.png",
    short:"Rack de TV com estrutura em ripas verticais de ferro preto, tampo e gaveteiro em madeira.",
    description:"Ripas verticais de ferro preto formam uma \"gaiola\" ao redor do móvel, com tampo em madeira e gaveteiro com puxadores discretos.",
    materials:"Ferro preto fosco + madeira maciça", dimensions:"160 × 45 × 40 cm", leadTime:"5 a 6 semanas" },

  { slug:"console-prateleira-aberta", name:"Console Prateleira Aberta", category:"Aparadores", price:1500,
    image:"assets/products/console-prateleira-aberta.png",
    short:"Console/aparador com tampo em madeira maciça e prateleira inferior, base em ferro preto.",
    description:"Linhas retas, tampo espesso em madeira maciça e prateleira inferior aberta em madeira, sobre estrutura soldada em ferro preto fosco. Ideal para hall de entrada ou atrás do sofá.",
    materials:"Madeira maciça + ferro preto fosco", dimensions:"120 × 80 × 35 cm", leadTime:"4 a 5 semanas" },
  { slug:"console-tronco-bruto", name:"Console Tronco Bruto", category:"Aparadores", price:2500,
    image:"assets/products/console-tronco-bruto.png",
    short:"Console inteiriço em madeira maciça de borda bruta, tampo e pernas na mesma textura crua de tronco.",
    description:"Tampo e pernas esculpidos na mesma peça de madeira maciça, com a textura bruta e a borda irregular do tronco preservadas em toda a superfície — sem uma única peça de metal. Uma peça escultural para hall de entrada, atrás do sofá ou como base para o Espelho Fatia de Tronco.",
    materials:"Madeira maciça de borda bruta (peça exclusiva, sem reposição idêntica)",
    dimensions:"Aprox. 150 × 80 × 35 cm (varia por peça, é natural/única)", leadTime:"Pronta entrega — peça única disponível" },
  { slug:"cristaleira-prateleira-escada", name:"Cristaleira Prateleira Escada", category:"Aparadores", price:3000,
    image:"assets/products/cristaleira-prateleira-escada.png",
    short:"Cristaleira com portas em madeira maciça e estrutura superior em ferro no formato de escada, com prateleiras abertas.",
    description:"Base fechada com três portas em madeira maciça para guardar louça, coroada por uma estrutura em ferro preto no formato de escada com prateleiras abertas para exibir objetos e livros.",
    materials:"Madeira maciça + ferro preto fosco", dimensions:"140 × 170 × 40 cm", leadTime:"6 a 7 semanas" },

  { slug:"trio-de-pedestais", name:"Trio de Pedestais Decorativos", category:"Decoração", price:900,
    image:"assets/products/trio-de-pedestais.png",
    short:"Conjunto de 3 pedestais em alturas diferentes, madeira maciça e ferro preto.",
    description:"Três colunas vazadas de alturas escalonadas, blocos de madeira maciça encaixados em estrutura de ferro preto. Vendidos em conjunto — para plantas, velas ou garrafas em composição decorativa.",
    materials:"Madeira maciça + ferro preto fosco", dimensions:"Alturas: 80 / 65 / 50 cm (base 20×20 cm)", leadTime:"3 a 4 semanas" },
  { slug:"adega-galho-de-arvore", name:"Adega Galho de Árvore", category:"Decoração", price:900,
    image:"assets/products/adega-galho-de-arvore.png",
    short:"Adega escultural para até 7 garrafas, feita a partir de um galho natural.",
    description:"Um galho selecionado pela forma de suas bifurcações naturais vira suporte para até 7 garrafas de vinho, montado sobre base circular em metal. Cada adega é única — a disposição das garrafas segue a forma do próprio galho.",
    materials:"Galho de madeira maciça + base em metal",
    dimensions:"Aprox. 30 × 75 × 30 cm (varia por peça)", leadTime:"Pronta entrega — peça única disponível" },
  { slug:"adega-parede-fatia-tronco", name:"Adega de Parede Fatia de Tronco", category:"Decoração", price:1000,
    image:"assets/products/adega-parede-fatia-tronco.png",
    short:"Adega de parede para até 5 garrafas, esculpida em fatia única de tronco com borda de casca preservada.",
    description:"Uma fatia inteiriça de tronco, com a borda de casca natural preservada, ganha furos diagonais para até 5 garrafas de vinho — cada gargalo é finalizado com um laço de barbante, remetendo à adega rústica de fazenda. Peça de parede que também funciona como escultura, já que os veios e rachaduras naturais da madeira ficam à mostra.",
    materials:"Fatia de tronco maciça (peça exclusiva, sem reposição idêntica)",
    dimensions:"Aprox. 40 × 95 cm (varia por peça, é natural/única)", leadTime:"Pronta entrega — peça única disponível" },
  { slug:"espelho-fatia-de-tronco", name:"Espelho Fatia de Tronco", category:"Decoração", price:3200,
    image:"assets/products/espelho-fatia-de-tronco.png",
    short:"Espelho redondo com moldura maciça em fatia de tronco, anéis de crescimento à mostra.",
    description:"A moldura nasce de uma fatia grossa de tronco, esculpida em formato de anel até revelar o espelho no centro — os anéis de crescimento da madeira ficam completamente à mostra, tornando cada peça única. Feito para pendurar sobre consoles, aparadores ou cômodas de entrada.",
    materials:"Fatia de tronco maciça + espelho",
    dimensions:"Aprox. 75 × 90 cm (varia por peça, é natural/única)", leadTime:"Pronta entrega — peça única disponível" }
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
