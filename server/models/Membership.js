import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "distribuidor", "viewer"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "invited", "disabled"],
      default: "active",
    },
  },
  { timestamps: true }
);

membershipSchema.index({ user: 1, business: 1 }, { unique: true });
membershipSchema.index({ business: 1, role: 1, status: 1 });

const Membership = mongoose.model("Membership", membershipSchema);

export default Membership;
