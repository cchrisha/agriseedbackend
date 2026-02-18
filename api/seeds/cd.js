import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";
import ActivityLog from "../../models/ActivityLog.js";

export default async function handler(req, res) {
  await dbConnect();

  const role = req.headers.role || "admin";
  const user = req.headers.user || "System";

  try {

    // ===============================
    // CREATE SEED
    // ===============================
    if (req.method === "POST") {

      const { name, variety, datePlanted, address } = req.body;

      if (!name || !datePlanted || !address)
        return res.status(400).json({ message: "Missing fields" });

      const seedCode = name.trim().substring(0, 3).toUpperCase();
      const tag = `PRB-${seedCode}`;

      // 🚨 PREVENT DUPLICATE NAME
      const exists = await Seed.findOne({
        name: new RegExp(`^${name}$`, "i"),
        isDeleted: false,
      });

      if (exists)
        return res.status(400).json({ message: "Seed already exists" });

      const seed = await Seed.create({
        name,
        variety,
        datePlanted,
        address,
        tag,
        isDeleted: false,
      });

      await ActivityLog.create({
        user,
        role,
        seed: seed._id,
        seedName: seed.name,
        seedTag: seed.tag,
        quantity: 0,
        process: "CREATED",
      });

      return res.status(201).json(seed);
    }

    // ===============================
    // SOFT DELETE
    // ===============================
    if (req.method === "DELETE") {

      const { seedId } = req.body;

      if (!seedId)
        return res.status(400).json({ message: "seedId required" });

      const seed = await Seed.findById(seedId);
      if (!seed) return res.status(404).json({ message: "Seed not found" });

      seed.isDeleted = true;
      seed.deletedAt = new Date();
      await seed.save();

      await ActivityLog.create({
        user,
        role,
        seed: seed._id,
        seedName: seed.name,
        seedTag: seed.tag,
        quantity: 0,
        process: "DELETED",
      });

      return res.json({ message: "Seed deleted" });
    }

    return res.status(405).json({ message: "Method not allowed" });

  } catch (err) {
    console.error("SEED ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
}
