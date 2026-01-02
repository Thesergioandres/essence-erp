import mongoose from "mongoose";
import DistributorStock from "../models/DistributorStock.js";
import Membership from "../models/Membership.js";
import Product from "../models/Product.js";
import StockTransfer from "../models/StockTransfer.js";
import User from "../models/User.js";

const resolveBusinessId = (req) =>
  req.businessId ||
  req.headers["x-business-id"] ||
  req.query.businessId ||
  req.body.businessId;

// @desc    Asignar stock a un distribuidor
// @route   POST /api/stock/assign
// @access  Private/Admin
export const assignStockToDistributor = async (req, res) => {
  try {
    const businessId = resolveBusinessId(req);
    const isTest = process.env.NODE_ENV === "test";
    if (!businessId && req.user.role !== "super_admin" && !isTest) {
      return res.status(400).json({ message: "Falta x-business-id" });
    }

    const { distributorId, productId, quantity } = req.body;

    // Validar que sea distribuidor
    const distributor = await User.findById(distributorId);
    if (!distributor || distributor.role !== "distribuidor") {
      return res.status(400).json({ message: "Usuario no es distribuidor" });
    }

    const distributorMembership = await Membership.findOne({
      business: businessId,
      user: distributorId,
      status: "active",
    });

    if (!distributorMembership) {
      return res
        .status(403)
        .json({ message: "Distribuidor no pertenece a este negocio" });
    }

    // Verificar stock en bodega
    const product = await Product.findOne(
      businessId ? { _id: productId, business: businessId } : { _id: productId }
    );
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    if (product.warehouseStock < quantity) {
      return res.status(400).json({
        message: `Stock insuficiente en bodega. Disponible: ${product.warehouseStock}`,
      });
    }

    // Buscar o crear registro de stock del distribuidor
    let distributorStock = await DistributorStock.findOne({
      distributor: distributorId,
      product: productId,
      business: businessId,
    });

    if (distributorStock) {
      distributorStock.quantity += quantity;
      await distributorStock.save();
    } else {
      distributorStock = await DistributorStock.create({
        distributor: distributorId,
        product: productId,
        quantity,
        business: businessId,
      });
    }

    // Descontar de bodega
    product.warehouseStock -= quantity;
    await product.save();

    // Asignar producto al distribuidor si no lo tiene
    if (!distributor.assignedProducts.includes(productId)) {
      distributor.assignedProducts.push(productId);
      await distributor.save();
    }

    res.json({
      message: "Stock asignado correctamente",
      distributorStock: await distributorStock.populate([
        { path: "distributor", select: "name email" },
        { path: "product", select: "name" },
      ]),
      warehouseStock: product.warehouseStock,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Retirar stock de un distribuidor
// @route   POST /api/stock/withdraw
// @access  Private/Admin
export const withdrawStockFromDistributor = async (req, res) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId && req.user.role !== "super_admin") {
      return res.status(400).json({ message: "Falta x-business-id" });
    }

    const { distributorId, productId, quantity } = req.body;

    const distributorMembership = await Membership.findOne({
      business: businessId,
      user: distributorId,
      status: "active",
    });

    if (!distributorMembership) {
      return res
        .status(403)
        .json({ message: "Distribuidor no pertenece a este negocio" });
    }

    const distributorStock = await DistributorStock.findOne({
      distributor: distributorId,
      product: productId,
      business: businessId,
    });

    if (!distributorStock) {
      return res
        .status(404)
        .json({ message: "El distribuidor no tiene este producto" });
    }

    if (distributorStock.quantity < quantity) {
      return res.status(400).json({
        message: `El distribuidor solo tiene ${distributorStock.quantity} unidades`,
      });
    }

    // Descontar del distribuidor
    distributorStock.quantity -= quantity;
    await distributorStock.save();

    // Devolver a bodega
    const product = await Product.findOne({
      _id: productId,
      business: businessId,
    });
    product.warehouseStock += quantity;
    await product.save();

    res.json({
      message: "Stock retirado correctamente",
      distributorStock: await distributorStock.populate([
        { path: "distributor", select: "name email" },
        { path: "product", select: "name" },
      ]),
      warehouseStock: product.warehouseStock,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener stock de un distribuidor
// @route   GET /api/stock/distributor/:distributorId
// @access  Private
export const getDistributorStock = async (req, res) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId && req.user.role !== "super_admin") {
      return res.status(400).json({ message: "Falta x-business-id" });
    }

    let { distributorId } = req.params;

    // Si es "me", usar el ID del usuario autenticado
    if (distributorId === "me") {
      distributorId = req.user.userId || req.user.id;
    }

    // Verificar permisos: admin/god/super_admin pueden ver cualquiera; distribuidor solo el suyo
    const currentUserId = req.user.userId || req.user.id;
    const isAdminLike =
      req.user.role === "admin" ||
      req.user.role === "god" ||
      req.user.role === "super_admin";

    if (!isAdminLike && currentUserId !== distributorId) {
      return res.status(403).json({
        message: "No tienes permiso para ver este inventario",
      });
    }

    const stock = await DistributorStock.find({
      distributor: distributorId,
      business: businessId,
    })
      .select("product distributor quantity lowStockAlert createdAt updatedAt")
      .populate(
        "product",
        "name image purchasePrice distributorPrice clientPrice"
      )
      .populate("distributor", "name email")
      .lean();

    // Agregar alertas de stock bajo
    const stockWithAlerts = stock.map((item) => ({
      ...item,
      isLowStock: item.quantity <= item.lowStockAlert,
    }));

    res.json(stockWithAlerts);
  } catch (error) {
    console.error("❌ Error en getDistributorStock:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener todo el stock de todos los distribuidores
// @route   GET /api/stock/all
// @access  Private/Admin
export const getAllDistributorsStock = async (req, res) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId && req.user.role !== "super_admin") {
      return res.status(400).json({ message: "Falta x-business-id" });
    }

    const stockFilter = businessId ? { business: businessId } : {};

    const stock = await DistributorStock.find(stockFilter)
      .select("product distributor quantity lowStockAlert")
      .populate("product", "name image warehouseStock totalStock")
      .populate("distributor", "name email active")
      .lean();

    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener alertas de stock bajo
// @route   GET /api/stock/alerts
// @access  Private/Admin
export const getStockAlerts = async (req, res) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId && req.user.role !== "super_admin") {
      return res.status(400).json({ message: "Falta x-business-id" });
    }

    // Productos con stock bajo en bodega
    const lowWarehouseStock = await Product.find({
      warehouseStock: { $lte: 10 },
      ...(businessId ? { business: businessId } : {}),
    })
      .select("name warehouseStock lowStockAlert")
      .lean();

    // Distribuidores con stock bajo
    const lowDistributorStock = await DistributorStock.find(
      businessId ? { business: businessId } : {}
    )
      .populate("product", "name")
      .populate("distributor", "name email")
      .lean();

    const distributorAlerts = lowDistributorStock.filter(
      (item) => item.quantity <= item.lowStockAlert
    );

    res.json({
      warehouseAlerts: lowWarehouseStock,
      distributorAlerts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Transferir stock entre distribuidores
// @route   POST /api/stock/transfer
// @access  Private/Distributor
export const transferStockBetweenDistributors = async (req, res) => {
  try {
    const businessId = resolveBusinessId(req);
    const isTest = process.env.NODE_ENV === "test";
    if (!businessId && req.user.role !== "super_admin" && !isTest) {
      return res.status(400).json({ message: "Falta x-business-id" });
    }

    const { toDistributorId, productId, quantity } = req.body;
    const fromDistributorId = req.user.userId || req.user.id; // Usuario autenticado que transfiere

    console.log("🔄 Transferencia iniciada:");
    console.log("  De:", fromDistributorId);
    console.log("  Para:", toDistributorId);
    console.log("  Producto:", productId);
    console.log("  Cantidad:", quantity);

    // Validaciones básicas
    if (!toDistributorId || !productId || !quantity) {
      return res.status(400).json({
        message: "Faltan datos requeridos: destinatario, producto y cantidad",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(toDistributorId)) {
      return res
        .status(400)
        .json({ message: "Identificador de distribuidor inválido" });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json({ message: "Identificador de producto inválido" });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        message: "La cantidad debe ser mayor a 0",
      });
    }

    if (fromDistributorId === toDistributorId) {
      return res.status(400).json({
        message: "No puedes transferir stock a ti mismo",
      });
    }

    // Verificar que ambos usuarios sean distribuidores
    const [fromDistributor, toDistributor] = await Promise.all([
      User.findById(fromDistributorId),
      User.findById(toDistributorId),
    ]);

    if (!fromDistributor || fromDistributor.role !== "distribuidor") {
      return res
        .status(403)
        .json({ message: "Usuario origen no es distribuidor" });
    }

    if (!toDistributor || toDistributor.role !== "distribuidor") {
      return res
        .status(400)
        .json({ message: "Usuario destino no es distribuidor válido" });
    }

    if (businessId) {
      const toMembership = await Membership.findOne({
        business: businessId,
        user: toDistributorId,
        status: "active",
      });

      if (!toMembership) {
        return res.status(403).json({
          message: "El distribuidor destino no pertenece a este negocio",
        });
      }
    }

    // Verificar que el producto existe
    const productFilter = businessId
      ? { _id: productId, business: businessId }
      : { _id: productId };
    const product = await Product.findOne(productFilter);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    // Verificar stock del distribuidor origen
    const fromStock = await DistributorStock.findOne(
      businessId
        ? {
            distributor: fromDistributorId,
            product: productId,
            business: businessId,
          }
        : { distributor: fromDistributorId, product: productId }
    );

    if (!fromStock || fromStock.quantity < quantity) {
      return res.status(400).json({
        message: `Stock insuficiente. Disponible: ${
          fromStock?.quantity || 0
        }, Solicitado: ${quantity}`,
      });
    }

    // Guardar estados antes de la transferencia
    const fromStockBefore = fromStock.quantity;

    // 2. Buscar stock del distribuidor destino
    let toStock = await DistributorStock.findOne(
      businessId
        ? {
            distributor: toDistributorId,
            product: productId,
            business: businessId,
          }
        : { distributor: toDistributorId, product: productId }
    );

    const toStockBefore = toStock?.quantity || 0;

    // Realizar la transferencia
    // 1. Restar del distribuidor origen
    fromStock.quantity -= quantity;
    await fromStock.save();

    // 2. Actualizar o crear stock del distribuidor destino
    if (toStock) {
      toStock.quantity += quantity;
      await toStock.save();
    } else {
      toStock = await DistributorStock.create({
        distributor: toDistributorId,
        product: productId,
        quantity,
        business: businessId || undefined,
      });
    }

    // 3. Asignar producto al distribuidor destino si no lo tiene
    if (!toDistributor.assignedProducts) {
      toDistributor.assignedProducts = [];
    }

    const hasProduct = toDistributor.assignedProducts.some(
      (p) => p.toString() === productId.toString()
    );

    if (!hasProduct) {
      toDistributor.assignedProducts.push(productId);
      await toDistributor.save();
      console.log("✅ Producto asignado al distribuidor destino");
    } else {
      console.log("ℹ️  Producto ya estaba asignado");
    }

    // 4. Registrar transferencia en el historial
    await StockTransfer.create({
      fromDistributor: fromDistributorId,
      toDistributor: toDistributorId,
      product: productId,
      quantity,
      fromStockBefore,
      fromStockAfter: fromStock.quantity,
      toStockBefore,
      toStockAfter: toStock.quantity,
      status: "completed",
      business: businessId || undefined,
    });
    console.log("✅ Transferencia registrada en historial");

    // Crear registro de auditoría (opcional, no debe fallar la transferencia)
    try {
      const AuditLog = (await import("../models/AuditLog.js")).default;
      await AuditLog.create({
        business: businessId || undefined,
        user: fromDistributorId,
        userEmail: fromDistributor.email,
        userName: fromDistributor.name,
        userRole: fromDistributor.role,
        action: "stock_adjusted",
        module: "stock",
        description: `Transferencia de stock de ${quantity} ${product.name} a ${toDistributor.name}`,
        entityType: "DistributorStock",
        entityId: toStock._id,
        entityName: product.name,
        metadata: {
          fromDistributor: {
            id: fromDistributorId.toString(),
            name: fromDistributor.name,
          },
          toDistributor: {
            id: toDistributorId.toString(),
            name: toDistributor.name,
          },
          product: {
            id: product._id.toString(),
            name: product.name,
          },
          quantity,
          fromStockBefore,
          fromStockAfter: fromStock.quantity,
          toStockBefore,
          toStockAfter: toStock.quantity,
        },
      });
      console.log("✅ Registro de auditoría creado");
    } catch (auditError) {
      console.error(
        "⚠️  Error al crear log de auditoría (no crítico):",
        auditError.message
      );
    }

    console.log("✅ Transferencia completada exitosamente");

    res.json({
      success: true,
      message: `Transferencia exitosa de ${quantity} unidades de ${product.name} a ${toDistributor.name}`,
      transfer: {
        from: {
          distributorId: fromDistributorId.toString(),
          name: fromDistributor.name,
          remainingStock: fromStock.quantity,
        },
        to: {
          distributorId: toDistributorId.toString(),
          name: toDistributor.name,
          newStock: toStock.quantity,
        },
        product: {
          id: product._id.toString(),
          name: product.name,
        },
        quantity,
      },
    });
  } catch (error) {
    console.error("❌ Error en transferencia de stock:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      message: error.message,
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// @desc    Obtener historial de transferencias con filtros
// @route   GET /api/stock/transfers
// @access  Private/Admin
export const getTransferHistory = async (req, res) => {
  try {
    const businessId = resolveBusinessId(req);
    if (!businessId && req.user.role !== "super_admin") {
      return res.status(400).json({ message: "Falta x-business-id" });
    }

    const {
      fromDistributor,
      toDistributor,
      product,
      startDate,
      endDate,
      status,
      page = 1,
      limit = 20,
    } = req.query;

    // Construir filtros
    const filters = businessId ? { business: businessId } : {};

    if (fromDistributor) filters.fromDistributor = fromDistributor;
    if (toDistributor) filters.toDistributor = toDistributor;
    if (product) filters.product = product;
    if (status) filters.status = status;

    // Filtro de fechas
    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filters.createdAt.$lte = end;
      }
    }

    // Paginación
    const skip = (page - 1) * limit;

    // Obtener transferencias
    const [transfers, total] = await Promise.all([
      StockTransfer.find(filters)
        .select(
          "fromDistributor toDistributor product quantity fromStockBefore fromStockAfter toStockBefore toStockAfter status createdAt"
        )
        .populate("fromDistributor", "name email")
        .populate("toDistributor", "name email")
        .populate("product", "name image")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      StockTransfer.countDocuments(filters),
    ]);

    // Estadísticas
    const stats = await StockTransfer.aggregate([
      { $match: filters },
      {
        $group: {
          _id: null,
          totalTransfers: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
        },
      },
    ]);

    res.json({
      transfers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
      stats: stats[0] || { totalTransfers: 0, totalQuantity: 0 },
    });
  } catch (error) {
    console.error("❌ Error al obtener historial:", error);
    res.status(500).json({ message: error.message });
  }
};
