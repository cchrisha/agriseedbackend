import mongoose from "mongoose";

const SeedSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    variant: { type: String },
    datePlanted: { type: Date, required: true },
    address: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Seed ||
  mongoose.model("Seed", SeedSchema);