import mongoose from "mongoose";

const SeedStockSchema = new mongoose.Schema(
  {
    seed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seed",
      required: true,
    },

    stockNo: {
      type: Number,
      required: true,
    },

    tag: {
      type: String,
    },

    status: {
      type: String,
      enum: ["PLANTED","STOCK-IN", "AVAILABLE", "STOCK-OUT", "MORTALITY", "REPLACED"],
      default: "STOCK-IN",
    },

    block: {
      type: Number,
      default: null,
    },

    lot: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

SeedStockSchema.index({ seed: 1, stockNo: 1 }, { unique: true });

export default mongoose.models.SeedStock ||
  mongoose.model("SeedStock", SeedStockSchema);
