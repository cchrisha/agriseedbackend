import mongoose from "mongoose";

const LegendaryBlockSchema = new mongoose.Schema({
  name: String,
  lots: { type: Number, default: 2 },
  slotsPerLot: { type: Number, default: 200 },
}, { timestamps: true });

export default mongoose.models.LegendaryBlock ||
  mongoose.model("LegendaryBlock", LegendaryBlockSchema);