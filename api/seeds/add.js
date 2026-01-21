import dbConnect from "../../../lib/db.js";
import Seed from "../../../models/Seed.js";
import SeedTransaction from "../../../models/SeedTransaction.js";
import { generateSeedTag } from "../../../lib/generateSeedTag.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { seedId, quantity, block, lot } = req.body;

    if (!seedId || !quantity || !block || !lot) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const seed = await Seed.findById(seedId);
    if (!seed) {
      return res.status(404).json({ message: "Seed not found" });
    }

    const tag = await generateSeedTag({
      name: seed.name,
      datePlanted: seed.datePlanted,
    });

    const tx = await SeedTransaction.create({
      seed: seed._id,
      tag,
      type: "add",
      quantity,
      block,
      lot,
    });

    return res.status(201).json(tx);

  } catch (err) {
    console.error("ADD SEED ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
