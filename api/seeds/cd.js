import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";

export default async function handler(req, res) {
  await dbConnect();

  try {

    // ===============================
    // 🌱 CREATE SEED
    // ===============================
    if (req.method === "POST") {

      const {
        name,
        variety,
        block,
        lot,
        datePlanted,
        address,
      } = req.body;

      if (!name || !block || !lot || !datePlanted || !address) {
        return res.status(400).json({ message: "Missing fields" });
      }

      const occupied = await Seed.findOne({ block, lot, isDeleted: false });
      if (occupied) {
        return res.status(400).json({ message: "Block and lot already occupied" });
      }

      const seedCode = name.substring(0, 3).toUpperCase();
      const d = new Date(datePlanted);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");

      const batchNo = `B${month}`;
      const tag = `PRB-${seedCode}-${year}-${month}-${day}-${batchNo}`;

      const seed = await Seed.create({
        name,
        variety,
        block,
        lot,
        datePlanted,
        address,
        tag,
        isDeleted: false,
      });

      return res.status(201).json(seed);
    }

    // ===============================
    // 🗑️ SOFT DELETE SEED
    // ===============================
    if (req.method === "DELETE") {

      const { seedId } = req.body;

      if (!seedId) {
        return res.status(400).json({ message: "Missing seedId" });
      }

      const seed = await Seed.findById(seedId);

      if (!seed) {
        return res.status(404).json({ message: "Seed not found" });
      }

      seed.isDeleted = true;
      seed.deletedAt = new Date();

      await seed.save();

      return res.json({ message: "Seed soft deleted" });
    }

    return res.status(405).json({ message: "Method not allowed" });

  } catch (err) {
    console.error("SEED API ERROR:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        message: "Duplicate seed or block/lot already used",
      });
    }

    return res.status(500).json({ message: "Server error" });
  }
}
