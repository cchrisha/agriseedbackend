import mongoose from "mongoose";

const LotSchema = new mongoose.Schema(
{
  block: Number,
  lot: Number,

  seed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Seed",
    default: null,
  }
},
{ timestamps:true }
);

LotSchema.index({ block:1, lot:1 }, { unique:true });

export default mongoose.models.Lot ||
mongoose.model("Lot", LotSchema);
