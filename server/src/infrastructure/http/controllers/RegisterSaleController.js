import mongoose from "mongoose";
import { RegisterSaleUseCase } from "../../../application/use-cases/RegisterSaleUseCase.js";

/**
 * Register Sale Controller
 * Entry point for the Sales Registration (Hexagonal Adapter)
 */
export const registerSale = async (req, res, next) => {
  let session = null;
  let useTransactions = false;

  try {
    // 1. Transaction Management (Infrastructure)
    // Check if we can use transactions (only works with replica sets)
    try {
      const client = mongoose.connection.getClient();
      const admin = client.db().admin();
      const result = await admin.command({ isMaster: 1 });
      useTransactions = result.setName !== undefined; // If setName exists, it's a replica set
    } catch (err) {
      // If check fails, assume we can't use transactions
      useTransactions = false;
    }

    if (useTransactions) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    // 2. Extract Data (Adapter)
    // Determine distributorId based on user role:
    // - If user is distributor: use their ID
    // - If user is admin: only set distributorId if explicitly provided in body
    let distributorId = null;
    if (req.user.role === "distribuidor") {
      // User is a distributor, this is their sale
      distributorId = req.user.id;
    } else if (req.body.distributorId) {
      // Admin can create sales on behalf of a distributor
      distributorId = req.body.distributorId;
    }

    const input = {
      user: req.user,
      businessId: req.headers["x-business-id"], // Assumed from middleware
      distributorId, // Correctly set based on role
      items: req.body.items, // Bulk Items Array
      paymentMethodId: req.body.paymentMethodId,
      customerId: req.body.customerId,
      creditDueDate: req.body.creditDueDate,
      initialPayment: req.body.initialPayment,
      saleDate: req.body.saleDate,
      deliveryMethodId: req.body.deliveryMethodId,
      shippingCost: req.body.shippingCost,
      notes: req.body.notes,
      distributorProfitPercentage: req.body.distributorProfitPercentage,
    };

    // 3. Invoke Application Use Case
    const useCase = new RegisterSaleUseCase();
    const result = await useCase.execute(input, session);

    // 4. Commit Transaction
    if (useTransactions && session) {
      await session.commitTransaction();
    }

    // 5. Send Response
    res.status(201).json({
      success: true,
      data: result,
      message: "Sale registered successfully (v2 hex)",
    });
  } catch (error) {
    // 6. Rollback on Error
    if (useTransactions && session) {
      await session.abortTransaction();
    }
    next(error); // Pass to global error handler
  } finally {
    // 7. End Session
    if (session) {
      session.endSession();
    }
  }
};
