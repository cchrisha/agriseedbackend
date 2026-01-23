import mongoose from "mongoose";

const SeedTransactionSchema = new mongoose.Schema(
  {
    seed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seed",
      required: true,
    },

    type: {
      type: String,
      enum: ["STOCK_IN", "STOCK-OUT", "MORTALITY", "REPLACE"],
      required: true,
    },

    quantity: { type: Number, required: true },
    batch: { type: String },

    startNo: Number,
    endNo: Number,

    note: String,
  },
  { timestamps: true }
);

export default mongoose.models.SeedTransaction ||
  mongoose.model("SeedTransaction", SeedTransactionSchema);
