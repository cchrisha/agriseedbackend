import mongoose from "mongoose";

const SeedStockSchema = new mongoose.Schema(
  {
    seed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seed",
      required: true,
    },

    block: { type: String, required: true },
    lot: { type: String, required: true },
    batch: { type: String, required: true },

    quantity: { type: Number, required: true },

    // SERIAL RANGE
    startNo: { type: Number, required: true },
    endNo: { type: Number, required: true },
  },
  { timestamps: true }
);

// ❗ ENFORCE 1 SEED PER BLOCK+LOT
SeedStockSchema.index({ seed: 1, block: 1, lot: 1 }, { unique: true });

export default mongoose.models.SeedStock ||
  mongoose.model("SeedStock", SeedStockSchema);
