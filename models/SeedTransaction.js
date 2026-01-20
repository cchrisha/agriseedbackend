import mongoose from "mongoose";

const SeedTransactionSchema = new mongoose.Schema(
  {
    seed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seed",
      required: true,
      index: true,
    },

    tag: {
      type: String,
      required: true,
      unique: true, // IMPORTANT: no duplicate tags
      index: true,
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
      cause: String,
      purpose: String,
      source: String,
      remarks: String,
    },
  },
  { timestamps: true }
);

export default mongoose.models.SeedTransaction ||
  mongoose.model("SeedTransaction", SeedTransactionSchema);
