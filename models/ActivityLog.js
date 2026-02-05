import mongoose from "mongoose";

const ActivityLogSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "rnd", "op-h", "op-non"],
      required: true,
    },

    seed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seed",
    },

    seedName: String,
    seedTag: String,

    quantity: Number,

    process: {
      type: String,
      enum: [
        "PLANTED",
        "CREATED",
        "DELETED",
        "STOCK-IN",
        "AVAILABLE",
        "STOCK-OUT",
        "MORTALITY",
        "REPLACED",
      ],
    },
  },
  { timestamps: true }
);

export default mongoose.models.ActivityLog ||
  mongoose.model("ActivityLog", ActivityLogSchema);
