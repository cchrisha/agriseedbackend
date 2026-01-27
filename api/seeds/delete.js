import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  await dbConnect();

  const { seedId } = req.body;

  const seed = await Seed.findById(seedId);

  if (!seed) return res.status(404).json({ message: "Seed not found" });

  seed.isDeleted = true;
  seed.deletedAt = new Date();

  await seed.save();

  res.json({ message: "Seed soft deleted" });
}
