import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";
import ActivityLog from "../../models/ActivityLog.js";

export default async function handler(req, res) {
  await dbConnect();

  try {

    // ===============================
    // 🌱 CREATE SEED
    // ===============================
    if (req.method === "POST") {

      const { name, variety, block, lot, datePlanted, address } = req.body;

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

      const tag = `PRB-${seedCode}-${year}-${month}-${day}-B${month}`;

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

        const role = req.headers.role || "admin";
        const user = req.headers.user || "System";

        try {
        await ActivityLog.create({
            user,
            role,
            seed: seed._id,
            seedName: seed.name,
            seedTag: seed.tag,
            quantity: 0,
            process: "CREATED",
        });
        } catch (logErr) {
        console.error("LOG FAILED:", logErr);
        }

      return res.status(201).json(seed);
    }

    // ===============================
    // 🗑 SOFT DELETE
    // ===============================
    if (req.method === "DELETE") {

      const { seedId } = req.body;

      const seed = await Seed.findById(seedId);
      if (!seed) return res.status(404).json({ message: "Seed not found" });

      seed.isDeleted = true;
      seed.deletedAt = new Date();
      await seed.save();

    try {
    await ActivityLog.create({
        user,
        role,
        seed: seed._id,
        seedName: seed.name,
        seedTag: seed.tag,
        quantity: 0,
        process: "DELETED",
    });
    } catch (e) {
    console.error("DELETE LOG FAILED", e);
    }

      return res.json({ message: "Seed soft deleted" });
    }

    return res.status(405).json({ message: "Method not allowed" });

  } catch (err) {
    console.error("SEED API ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
