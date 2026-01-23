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
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ["STOCK-IN", "STOCK-OUT", "MORTALITY","REPLACED"],
      default: "STOCK-IN",
    },
  },
  { timestamps: true }
);

SeedStockSchema.index({ seed: 1, stockNo: 1 }, { unique: true });

export default mongoose.models.SeedStock ||
  mongoose.model("SeedStock", SeedStockSchema);
