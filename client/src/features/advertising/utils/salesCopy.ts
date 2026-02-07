/**
 * Generador de textos de venta automáticos
 */
import type { AdProduct } from "../types/advertising.types";

const templates = [
  (p: AdProduct) =>
    `✨ ${p.name} ✨\n💰 Solo $${p.price.toLocaleString("es-MX")}\n\n¡No te lo pierdas! Disponible ahora.\n📩 Escríbenos para pedirlo.`,
  (p: AdProduct) =>
    `🔥 OFERTA DEL DÍA 🔥\n\n${p.name}\nPrecio: $${p.price.toLocaleString("es-MX")}\n\n¡Aprovecha antes de que se agote!\n📲 Haz tu pedido ya.`,
  (p: AdProduct) =>
    `💎 ${p.name}\n\n🏷️ $${p.price.toLocaleString("es-MX")}\n${p.description ? `\n${p.description}\n` : ""}\n✅ Calidad garantizada\n📦 Envío rápido\n\n¡Pide el tuyo!`,
  (p: AdProduct) =>
    `⭐ Producto Destacado ⭐\n\n${p.name}\n💵 $${p.price.toLocaleString("es-MX")}\n\n🛒 ¡Agrégalo a tu pedido hoy!`,
  (p: AdProduct) =>
    `🎉 ¡Nuevo en catálogo!\n\n${p.name} — $${p.price.toLocaleString("es-MX")}\n\nEl producto que estabas esperando ya está aquí.\n💬 Escríbenos y te lo apartamos.`,
];

export function generateSalesCopy(product: AdProduct): string {
  const idx = Math.floor(Math.random() * templates.length);
  return templates[idx](product);
}

export function generateAllCopies(product: AdProduct): string[] {
  return templates.map(fn => fn(product));
}
