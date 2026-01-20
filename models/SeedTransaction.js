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
      enum: ["add", "mortality", "replace", "distribute"],
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    block: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    lot: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    metadata: {
      cause: String,     // mortality
      purpose: String,   // distribute
      source: String,    // replace
      remarks: String,
    },

    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.models.SeedTransaction ||
  mongoose.model("SeedTransaction", SeedTransactionSchema);
