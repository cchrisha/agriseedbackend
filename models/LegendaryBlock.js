import mongoose from "mongoose";

const LegendaryBlockSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "Legendary Block",
    },

    // 🔥 This is what planting system will use
    blockNumber: {
      type: Number,
      required: true,
      unique: true,
    },

    lots: {
      type: Number,
      default: 2,
    },

    slotsPerLot: {
      type: Number,
      default: 200,
    },
  },
  { timestamps: true }
);

export default mongoose.models.LegendaryBlock ||
  mongoose.model("LegendaryBlock", LegendaryBlockSchema);