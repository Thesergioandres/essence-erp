import { v4 as uuidv4 } from "uuid";
import DistributorStock from "../../../models/DistributorStock.js";
import Membership from "../../../models/Membership.js";
import PaymentMethod from "../../../models/PaymentMethod.js";
import { FinanceService } from "../../domain/services/FinanceService.js";
import { InventoryService } from "../../domain/services/InventoryService.js";
import CreditRepository from "../../infrastructure/database/repositories/CreditRepository.js";
import { ProductRepository } from "../../infrastructure/database/repositories/ProductRepository.js";
import ProfitHistoryRepository from "../../infrastructure/database/repositories/ProfitHistoryRepository.js";
import { SaleRepository } from "../../infrastructure/database/repositories/SaleRepository.js";
export class RegisterSaleUseCase {
  constructor() {
    this.saleRepository = new SaleRepository();
    this.productRepository = new ProductRepository();
  }

  /**
   * Orchestrates the BULK sale registration process.
   *
   * ⚠️ INVENTORY SYMMETRY NOTE:
   * This V2 implementation deducts stock from Product.totalStock (global warehouse).
   * If you need to support sales from Branches or Distributor Stock, you must:
   * 1. Add branchId parameter to identify source
   * 2. Call BranchStock.findOneAndUpdate() or DistributorStock.findOneAndUpdate()
   * 3. Ensure DeleteSaleController mirrors this logic when restoring stock
   *
   * Currently, DeleteSaleController checks sale.branch/sale.distributor fields,
   * but this UseCase does NOT set those fields from actual stock sources.
   *
   * @param {Object} input - DTO containing sale details
   * @param {Array} input.items - Array of { productId, quantity, salePrice }
   * @param {Object} input.user - User performing the action
   * @param {mongoose.ClientSession} session - Active transaction session
   */
  async execute(input, session) {
    const {
      user,
      items, // Expecting Array
      businessId,
      distributorId,
      notes,
      paymentMethodId,
      customerId,
      creditDueDate,
      initialPayment,
      saleDate,
      deliveryMethodId,
      shippingCost,
      distributorProfitPercentage = 20,
    } = input;

    // 1. Validation (Business Rules)
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("No items provided for sale.");
    }

    // 1.1 Resolve PaymentMethod
    // If paymentMethodId is a string code like "cash", "credit", find the actual ObjectId
    let resolvedPaymentMethodId = paymentMethodId;
    let paymentMethodCode = null;

    if (paymentMethodId && typeof paymentMethodId === "string") {
      // Check if it's a valid ObjectId format (24 hex chars)
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(paymentMethodId);

      if (!isObjectId) {
        // It's a code like "cash", "credit", need to lookup
        const paymentMethod = await PaymentMethod.findOne({
          business: businessId,
          code: paymentMethodId,
        });

        if (paymentMethod) {
          resolvedPaymentMethodId = paymentMethod._id;
          paymentMethodCode = paymentMethod.code;
        } else {
          // If not found in business-specific methods, try system-wide defaults
          // For backwards compatibility or system codes
          console.warn(
            `PaymentMethod with code "${paymentMethodId}" not found for business ${businessId}. Using code directly.`,
          );
          // Keep the code, but don't set ObjectId
          resolvedPaymentMethodId = null;
          paymentMethodCode = paymentMethodId;
        }
      }
    }

    if (!paymentMethodCode && resolvedPaymentMethodId) {
      const paymentMethod = await PaymentMethod.findOne({
        _id: resolvedPaymentMethodId,
        business: businessId,
      });
      if (paymentMethod) {
        paymentMethodCode = paymentMethod.code;
      }
    }

    const saleGroupId = uuidv4(); // Unique ID for this batch

    // 2. PHASE 1: Validate ALL items BEFORE making any changes
    const validatedItems = [];
    for (const item of items) {
      const { productId, quantity, salePrice } = item;

      if (quantity <= 0)
        throw new Error(`Invalid quantity for product ${productId}`);

      const product = await this.productRepository.findById(productId);
      if (!product) throw new Error(`Product not found: ${productId}`);

      // Check stock availability
      const hasStock = InventoryService.hasSufficientStock(
        product.totalStock,
        quantity,
      );
      if (!hasStock) {
        throw new Error(
          `Insufficient stock for ${product.name}. Requested: ${quantity}, Available: ${product.totalStock}`,
        );
      }

      // If distributor sale, check distributor stock
      if (distributorId) {
        const distStock = await DistributorStock.findOne({
          business: businessId,
          distributor: distributorId,
          product: productId,
        });

        if (!distStock || distStock.quantity < quantity) {
          throw new Error(
            `Insufficient distributor stock for ${product.name}. Requested: ${quantity}, Available: ${distStock?.quantity || 0}`,
          );
        }
      }

      // Calculate financials
      const costBasis = product.averageCost || product.purchasePrice || 0;
      const isDistributorSale = Boolean(distributorId);
      const effectiveDistributorProfitPercentage = isDistributorSale
        ? distributorProfitPercentage
        : 0;
      const distributorPrice = isDistributorSale
        ? FinanceService.calculateDistributorPrice(
            salePrice,
            effectiveDistributorProfitPercentage,
          )
        : salePrice;
      const distributorProfit = isDistributorSale
        ? FinanceService.calculateDistributorProfit(
            salePrice,
            distributorPrice,
            quantity,
          )
        : 0;
      const adminProfit = FinanceService.calculateAdminProfit(
        salePrice,
        costBasis,
        distributorProfit,
        quantity,
      );
      const totalProfit = distributorProfit + adminProfit;

      validatedItems.push({
        productId,
        product,
        quantity,
        salePrice,
        costBasis,
        distributorPrice,
        distributorProfit,
        adminProfit,
        totalProfit,
        distributorProfitPercentage: effectiveDistributorProfitPercentage,
      });
    }

    // 3. PHASE 2: All validations passed, now make the changes
    const results = [];
    const creditItems = [];
    let totalTransactionAmount = 0;
    let netTransactionProfit = 0;

    for (const item of validatedItems) {
      const {
        productId,
        product,
        quantity,
        salePrice,
        costBasis,
        distributorPrice,
        distributorProfit,
        adminProfit,
        totalProfit,
        distributorProfitPercentage,
      } = item;

      // E. Create Sale Record FIRST (Infra)
      const requiresAdminConfirmation = Boolean(distributorId);
      const isCreditSale = paymentMethodCode === "credit";
      const shouldConfirmNow = !requiresAdminConfirmation && !isCreditSale;

      const saleData = {
        business: businessId,
        product: productId,
        productName: product.name,
        quantity,
        salePrice,
        purchasePrice: product.purchasePrice,
        averageCostAtSale: costBasis,
        distributorPrice,
        distributorProfit,
        adminProfit,
        totalProfit,
        netProfit: totalProfit, // Item level net profit placeholder
        distributorProfitPercentage,
        notes,
        saleDate: input.saleDate || new Date(),
        saleGroupId, // Link them!
        paymentMethod: resolvedPaymentMethodId, // Use resolved ObjectId
        paymentMethodCode: paymentMethodCode, // Store the code for quick lookups
        deliveryMethod: deliveryMethodId,
        shippingCost: 0,
        createdBy: user.id, // Track who created the sale
        // 💰 FINANCIAL LOGIC FIX:
        // Cash sales (non-credit) must be CONFIRMED immediately to count towards profit.
        // Credit sales remain PENDING until fully paid.
        paymentStatus: shouldConfirmNow ? "confirmado" : "pendiente",
        paymentConfirmedAt: shouldConfirmNow ? new Date() : null,
      };

      // Only set distributor field if this is actually a distributor sale
      if (distributorId) {
        saleData.distributor = distributorId;
      }

      const createdSale = await this.saleRepository.create(saleData, session);
      results.push(createdSale);

      creditItems.push({
        product: productId,
        productName: product.name,
        quantity,
        unitPrice: salePrice,
        subtotal: salePrice * quantity,
        cost: costBasis * quantity,
        image: product.image?.url || product.image || "",
      });

      // F. Deduct Stock ONLY AFTER sale is confirmed (Infra) - LOCATION-AWARE
      // This ensures stock is only deducted if the sale was successfully created
      if (distributorId) {
        // Distributor Sale → Deduct from DistributorStock
        const distStock = await DistributorStock.findOneAndUpdate(
          {
            business: businessId,
            distributor: distributorId,
            product: productId,
          },
          { $inc: { quantity: -quantity } },
          session ? { session, new: true } : { new: true },
        );

        if (!distStock) {
          throw new Error(
            `Distributor stock not found for product ${productId}. Ensure stock is assigned first.`,
          );
        }

        console.log(
          `📦 Deducted ${quantity} from DistributorStock (distributor: ${distributorId})`,
        );
      } else {
        // Admin Sale → Deduct from Warehouse
        await this.productRepository.updateWarehouseStock(
          productId,
          -quantity,
          session,
        );
        console.log(`📦 Deducted ${quantity} from Warehouse (admin sale)`);
      }

      // Always update global totalStock counter for statistics
      await this.productRepository.updateStock(productId, -quantity, session);

      // G. Create ProfitHistory entries for tracking
      // Only create entries for CONFIRMED sales
      if (saleData.paymentStatus === "confirmado") {
        const saleDate = input.saleDate || new Date();

        // If distributor sale, create entry for distributor's profit
        if (distributorId && distributorProfit > 0) {
          await ProfitHistoryRepository.create({
            business: businessId,
            user: distributorId,
            type: "venta_normal",
            amount: distributorProfit,
            sale: createdSale._id,
            product: productId,
            description: `Comisión por venta ${createdSale.saleId}`,
            date: saleDate,
            metadata: {
              quantity,
              salePrice,
              saleId: createdSale.saleId,
              commission: distributorProfitPercentage,
            },
          });
        }

        // Create entry for admin's profit
        if (adminProfit > 0) {
          // Find admin user for this business via Membership
          const adminMembership = await Membership.findOne({
            business: businessId,
            role: "admin",
            status: "active",
          })
            .select("user")
            .lean();

          if (adminMembership) {
            await ProfitHistoryRepository.create({
              business: businessId,
              user: adminMembership.user,
              type: "venta_normal",
              amount: adminProfit,
              sale: createdSale._id,
              product: productId,
              description: distributorId
                ? `Ganancia de venta ${createdSale.saleId} (distribuidor)`
                : `Venta directa ${createdSale.saleId}`,
              date: saleDate,
              metadata: {
                quantity,
                salePrice,
                saleId: createdSale.saleId,
              },
            });
          }
        }
      }

      totalTransactionAmount += salePrice * quantity;
      netTransactionProfit += totalProfit;
    }

    if (paymentMethodCode === "credit") {
      if (!customerId) {
        throw new Error("El cliente es obligatorio para ventas a crédito.");
      }

      const credit = await CreditRepository.create(
        businessId,
        {
          customerId,
          amount: totalTransactionAmount,
          dueDate: creditDueDate,
          description: notes,
          items: creditItems,
          saleId: results[0]?._id || null,
        },
        user.id,
      );

      if (initialPayment && Number(initialPayment) > 0) {
        await CreditRepository.registerPayment(
          credit._id,
          Number(initialPayment),
          "Pago inicial",
          user.id,
        );
      }
    }

    // Adjust Net Profit with Shipping (Once)
    // This return object is what the Frontend receives
    return {
      saleGroupId,
      totalAmount: totalTransactionAmount,
      totalItems: results.length,
      netProfit: netTransactionProfit - (shippingCost || 0),
      adminProfit: results.reduce((sum, r) => sum + r.adminProfit, 0),
    };
  }
}
