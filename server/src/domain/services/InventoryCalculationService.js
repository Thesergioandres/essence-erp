const roundTo = (value, decimals = 2) => {
  const factor = 10 ** decimals;
  return Math.round((Number(value || 0) + Number.EPSILON) * factor) / factor;
};

const toFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toPositiveNumber = (value) => {
  const parsed = toFiniteNumber(value);
  return parsed > 0 ? parsed : 0;
};

const extractAmountFromObject = (item) => {
  if (!item || typeof item !== "object") {
    return 0;
  }

  const candidates = [
    item.amount,
    item.value,
    item.cost,
    item.total,
    item.totalCost,
    item.additionalCost,
  ];

  for (const candidate of candidates) {
    const parsed = toPositiveNumber(candidate);
    if (parsed > 0) {
      return parsed;
    }
  }

  const unitCost = toPositiveNumber(item.unitCost);
  const quantity = toPositiveNumber(item.quantity || 1);

  if (unitCost > 0 && quantity > 0) {
    return unitCost * quantity;
  }

  return 0;
};

const normalizeAdditionalCosts = (rawAdditionalCosts) => {
  if (
    rawAdditionalCosts === undefined ||
    rawAdditionalCosts === null ||
    rawAdditionalCosts === ""
  ) {
    return { additionalCostsTotal: 0, additionalCostsBreakdown: [] };
  }

  const normalizedItems = [];

  if (Array.isArray(rawAdditionalCosts)) {
    rawAdditionalCosts.forEach((item, index) => {
      const amount =
        typeof item === "number" || typeof item === "string"
          ? toPositiveNumber(item)
          : extractAmountFromObject(item);

      if (amount <= 0) {
        return;
      }

      const fallbackLabel = `Additional cost ${index + 1}`;
      const label =
        typeof item === "object" && item
          ? String(item.label || item.name || item.type || fallbackLabel)
          : fallbackLabel;

      normalizedItems.push({
        label,
        amount: roundTo(amount, 2),
      });
    });
  } else {
    const amount = toPositiveNumber(rawAdditionalCosts);
    if (amount > 0) {
      normalizedItems.push({
        label: "Additional cost",
        amount: roundTo(amount, 2),
      });
    }
  }

  const additionalCostsTotal = roundTo(
    normalizedItems.reduce(
      (sum, item) => sum + toPositiveNumber(item.amount),
      0,
    ),
    2,
  );

  return {
    additionalCostsTotal,
    additionalCostsBreakdown: normalizedItems,
  };
};

class InventoryCalculationService {
  static normalizeAdditionalCosts(rawAdditionalCosts) {
    return normalizeAdditionalCosts(rawAdditionalCosts);
  }

  static calculateWeightedEntryCost({
    previousStock,
    previousAverageCost,
    incomingQuantity,
    incomingUnitCost,
    additionalCosts,
    costingMethod = "average",
  }) {
    const normalizedIncomingQuantity = toPositiveNumber(incomingQuantity);

    if (normalizedIncomingQuantity <= 0) {
      const error = new Error("incomingQuantity must be greater than zero");
      error.statusCode = 400;
      throw error;
    }

    const normalizedPreviousStock = Math.max(0, toFiniteNumber(previousStock));
    const normalizedPreviousAverageCost = Math.max(
      0,
      toFiniteNumber(previousAverageCost),
    );

    const fallbackIncomingUnitCost =
      toPositiveNumber(incomingUnitCost) || normalizedPreviousAverageCost;

    const { additionalCostsTotal, additionalCostsBreakdown } =
      normalizeAdditionalCosts(additionalCosts);

    const baseTotalCost = roundTo(
      normalizedIncomingQuantity * fallbackIncomingUnitCost,
      2,
    );

    const totalEntryCost = roundTo(baseTotalCost + additionalCostsTotal, 2);
    const weightedUnitCost = roundTo(
      totalEntryCost / normalizedIncomingQuantity,
      4,
    );

    const previousInventoryValue = roundTo(
      normalizedPreviousStock * normalizedPreviousAverageCost,
      2,
    );

    const newTotalStock = normalizedPreviousStock + normalizedIncomingQuantity;

    const usesFixedCosting =
      String(costingMethod || "").toLowerCase() === "fixed";
    const newTotalInventoryValue = usesFixedCosting
      ? roundTo(newTotalStock * normalizedPreviousAverageCost, 2)
      : roundTo(previousInventoryValue + totalEntryCost, 2);

    const newAverageCost = usesFixedCosting
      ? roundTo(normalizedPreviousAverageCost, 4)
      : newTotalStock > 0
        ? roundTo(newTotalInventoryValue / newTotalStock, 4)
        : weightedUnitCost;

    return {
      previousStock: normalizedPreviousStock,
      previousAverageCost: roundTo(normalizedPreviousAverageCost, 4),
      previousInventoryValue,
      incomingQuantity: normalizedIncomingQuantity,
      baseUnitCost: roundTo(fallbackIncomingUnitCost, 4),
      baseTotalCost,
      additionalCostsTotal,
      additionalCostsBreakdown,
      totalEntryCost,
      weightedUnitCost,
      newTotalStock,
      newTotalInventoryValue,
      newAverageCost,
      usesFixedCosting,
    };
  }
}

export default InventoryCalculationService;
