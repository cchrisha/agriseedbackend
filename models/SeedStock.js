import mongoose from "mongoose";

const SeedStockSchema = new mongoose.Schema(
  {
    seed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seed",
      required: true,
    },

    stockNo: Number,

    tag: String,

    status: {
      type: String,
      enum: ["PLANTED","STOCK-IN", "AVAILABLE", "STOCK-OUT", "MORTALITY", "REPLACED","MORTALITY-DOC"],
      default: "STOCK-IN",
    },

    block: Number,
    lot: Number,
  },
  { timestamps: true }
);

// unique ONLY when stockNo exists
SeedStockSchema.index(
  { seed: 1, stockNo: 1 },
  {
    unique: true,
    partialFilterExpression: { stockNo: { $exists: true } }
  }
);

export default mongoose.models.SeedStock ||
  mongoose.model("SeedStock", SeedStockSchema);
