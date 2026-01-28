// import mongoose from "mongoose";

// const SeedSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true },
//     variant: { type: String },

//     block: {
//       type: Number,
//       required: true,
//       min: 1,
//       max: 12,
//     },

//     lot: {
//       type: Number,
//       required: true,
//       enum: [1, 2], // tig-dalawang lot lang
//     },

//     datePlanted: { type: Date, required: true },
//     address: { type: String, required: true },
//         // ✅ ADD THIS
//     tag: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//   },
//   { timestamps: true }
// );

// SeedSchema.index({ block: 1, lot: 1 }, { unique: true });

// SeedSchema.index({ name: 1, datePlanted: 1 }, { unique: true });

// export default mongoose.models.Seed ||
//   mongoose.model("Seed", SeedSchema);
import mongoose from "mongoose";

const SeedSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    variant: { type: String },

    block: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    lot: {
      type: Number,
      required: true,
      enum: [1, 2],
    },

    datePlanted: { type: Date, required: true },
    address: { type: String, required: true },

    tag: {
      type: String,
      required: true,
      unique: true,
    },

    // =====================
    // SOFT DELETE
    // =====================
    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

SeedSchema.index({ block: 1, lot: 1 }, { unique: true });
SeedSchema.index({ name: 1, datePlanted: 1 }, { unique: true });

export default mongoose.models.Seed ||
  mongoose.model("Seed", SeedSchema);
