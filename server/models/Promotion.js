import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    quantity: { type: Number, default: 1, min: 1 },
    discountType: {
      type: String,
      enum: ["percentage", "amount", "free"],
      default: "percentage",
    },
    discountValue: { type: Number, default: 0 },
  },
  { _id: false }
);

const ruleThresholdSchema = new mongoose.Schema(
  {
    minQty: { type: Number, default: 0 },
    minSubtotal: { type: Number, default: 0 },
  },
  { _id: false }
);

const volumeRuleSchema = new mongoose.Schema(
  {
    minQty: { type: Number, default: 0 },
    discountType: {
      type: String,
      enum: ["percentage", "amount"],
      default: "percentage",
    },
    discountValue: { type: Number, default: 0 },
  },
  { _id: false }
);

const promotionSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: {
      type: String,
      enum: ["bogo", "combo", "volume", "discount"],
      default: "discount",
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "active", "paused", "archived"],
      default: "active",
      index: true,
    },
    exclusive: { type: Boolean, default: false },
    startDate: { type: Date },
    endDate: { type: Date },
    branches: [{ type: mongoose.Schema.Types.ObjectId, ref: "Branch" }],
    segments: [{ type: String, trim: true }],
    customers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Customer" }],
    buyItems: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, default: 1, min: 1 },
      },
    ],
    rewardItems: [rewardSchema],
    comboItems: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, default: 1, min: 1 },
      },
    ],
    discount: {
      type: {
        type: String,
        enum: ["percentage", "amount"],
        default: "percentage",
      },
      value: { type: Number, default: 0 },
    },
    thresholds: ruleThresholdSchema,
    volumeRule: volumeRuleSchema,
    financialImpact: {
      expectedMargin: { type: Number },
      distributorCommission: { type: Number },
      notes: { type: String },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    usageCount: { type: Number, default: 0 },
    lastUsedAt: { type: Date },
  },
  { timestamps: true }
);

promotionSchema.index({ business: 1, status: 1, type: 1 });
promotionSchema.index({ business: 1, startDate: 1, endDate: 1 });

export default mongoose.model("Promotion", promotionSchema);
