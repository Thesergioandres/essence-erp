const normalizeId = (value) => {
  if (!value) return "";
  if (typeof value === "object") {
    return String(value._id || value.id || value);
  }
  return String(value);
};

const buildQuantityMap = (sales) => {
  const map = new Map();
  sales.forEach((sale) => {
    const productId = normalizeId(sale.product || sale.productId);
    if (!productId) return;
    const qty = Number(sale.quantity || 0);
    map.set(productId, (map.get(productId) || 0) + qty);
  });
  return map;
};

const computePromotionUsageUnits = (promotion, sales) => {
  const comboItems = Array.isArray(promotion?.comboItems)
    ? promotion.comboItems
    : [];
  if (comboItems.length === 0) return 1;

  const quantities = buildQuantityMap(sales);
  let minRatio = Number.POSITIVE_INFINITY;

  comboItems.forEach((item) => {
    const productId = normalizeId(item.product);
    const requiredQty = Number(item.quantity || 0);
    if (!productId || requiredQty <= 0) return;
    const soldQty = quantities.get(productId) || 0;
    const ratio = Math.floor(soldQty / requiredQty);
    minRatio = Math.min(minRatio, ratio);
  });

  if (!Number.isFinite(minRatio) || minRatio <= 0) {
    return 0;
  }

  return minRatio;
};

const buildPromotionSalesSummary = (promotion, sales) => {
  const unitsSold = sales.reduce(
    (sum, sale) => sum + Number(sale.quantity || 0),
    0,
  );
  const revenue = sales.reduce(
    (sum, sale) =>
      sum + Number(sale.salePrice || 0) * Number(sale.quantity || 0),
    0,
  );
  const usageCount = computePromotionUsageUnits(promotion, sales);

  return {
    usageCount,
    unitsSold,
    revenue,
  };
};

export { buildPromotionSalesSummary, computePromotionUsageUnits, normalizeId };
