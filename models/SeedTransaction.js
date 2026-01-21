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
      index: true, // ❌ not unique
    },

    type: {
      type: String,
      enum: ["add"],
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
  },
  { timestamps: true }
);
