import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";
import SeedTransaction from "../../models/SeedTransaction.js";
import { auth } from "../../middleware/auth.js";
import { allow } from "../../middleware/allow.js";
import { generateSeedTag } from "../../lib/generateSeedTag.js";

const ROLES = ["admin", "rnd", "op-h", "op-non"];

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  try {
    await dbConnect();

    const user = auth(req);
    if (!user || !allow(user, ROLES))
      return res.status(401).json({ message: "Unauthorized" });

    const { seedId, quantity, block, lot, remarks } = req.body;

    const seed = await Seed.findById(seedId);
    if (!seed)
      return res.status(404).json({ message: "Seed not found" });

    const tag = await generateSeedTag({
      seedName: seed.name,
      date: new Date(),
      block,
      lot,
    });

    const tx = await SeedTransaction.create({
      seed: seedId,
      tag,
      type: "add",
      quantity,
      block,
      lot,
      metadata: { remarks },
    });

    res.status(201).json(tx);
  } catch (err) {
    console.error("ADD SEED ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
}
