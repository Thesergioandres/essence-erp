import mongoose from "mongoose";

const inventoryEntrySchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      index: true,
      default: null,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    notes: { type: String, trim: true },
    requestId: { type: String, index: true },
    destination: {
      type: String,
      enum: ["branch", "warehouse"],
      default: "warehouse",
    },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

inventoryEntrySchema.index({ business: 1, createdAt: -1 });

export default mongoose.model("InventoryEntry", inventoryEntrySchema);
