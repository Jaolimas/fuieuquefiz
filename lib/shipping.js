/* ==========================================================================
   FuiEuQueFiz — lib/shipping.js
   Calcula o frete a partir do endereço de entrega do cliente: geocodifica
   o endereço (Nominatim/OpenStreetMap, gratuito, sem chave de API) e mede
   a distância em linha reta até Campinas-SP (sede da oficina). Frete
   grátis até 80km, adicional de R$50 entre 80km e 100km, e endereços
   acima de 100km são recusados — a loja só entrega até esse raio.

   Fica em lib/, não em api/, porque é importado por três rotas diferentes
   (api/shipping.js, pra prévia do frete no checkout antes de pagar;
   api/create-order.js, pra cobrança de verdade; api/send-receipt.js, pro
   e-mail de recibo) — um módulo só, em vez de duplicar como a regra de
   desconto (que é só aritmética). Esse cálculo depende de uma chamada de
   rede (geocodificação), então duplicar o código não traria nada, só
   risco de divergência.

   Sem variável de ambiente — Nominatim é público, só exige um User-Agent
   identificando a aplicação (política de uso deles).
   ========================================================================== */

const CAMPINAS_LAT = -22.9099;
const CAMPINAS_LNG = -47.0626;

const FREE_SHIPPING_RADIUS_KM = 80;
const MAX_DELIVERY_RADIUS_KM = 100;
const SHIPPING_FEE = 50;

const REQUIRED_FIELDS = ["cep", "street", "number", "neighborhood", "city", "state"];

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function buildAddressQuery(address) {
  return [
    [address.street, address.number].filter(Boolean).join(", "),
    address.neighborhood,
    address.city,
    address.state,
    "Brazil"
  ].filter(Boolean).join(", ");
}

async function geocodeAddress(address) {
  const url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=" + encodeURIComponent(buildAddressQuery(address));

  const res = await fetch(url, {
    headers: {
      /* Nominatim exige um User-Agent identificando a aplicação — política de uso deles. */
      "User-Agent": "FuiEuQueFiz-Checkout/1.0 (contato@fuieuquefiz.com.br)"
    }
  });

  if (!res.ok) throw new Error("Nominatim respondeu status " + res.status);

  const results = await res.json();
  if (!Array.isArray(results) || results.length === 0) return null;

  const lat = parseFloat(results[0].lat);
  const lng = parseFloat(results[0].lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
}

/* ==========================================================================
   Retorna sempre { ok: true, fee, distanceKm } ou { ok: false, message }.
   Nunca lança — quem chama não precisa de try/catch.
   ========================================================================== */
export async function calculateShipping(address) {
  for (const field of REQUIRED_FIELDS) {
    if (!address || !String(address[field] || "").trim()) {
      return { ok: false, message: "Endereço de entrega incompleto. Preencha todos os campos obrigatórios." };
    }
  }

  let coords;
  try {
    coords = await geocodeAddress(address);
  } catch (err) {
    console.error("Falha ao geocodificar endereço:", err.message);
    return { ok: false, message: "Não foi possível calcular o frete para esse endereço agora. Confira os dados ou finalize pelo WhatsApp." };
  }

  if (!coords) {
    return { ok: false, message: "Não conseguimos localizar esse endereço. Confira o CEP, número e cidade e tente novamente." };
  }

  const distanceKm = haversineKm(CAMPINAS_LAT, CAMPINAS_LNG, coords.lat, coords.lng);
  const roundedKm = Math.round(distanceKm);

  if (distanceKm > MAX_DELIVERY_RADIUS_KM) {
    return {
      ok: false,
      distanceKm: roundedKm,
      message: "Infelizmente ainda não entregamos nesse endereço — atendemos só até 100km de Campinas-SP (você está a aproximadamente " + roundedKm + "km)."
    };
  }

  return {
    ok: true,
    fee: distanceKm > FREE_SHIPPING_RADIUS_KM ? SHIPPING_FEE : 0,
    distanceKm: roundedKm
  };
}
