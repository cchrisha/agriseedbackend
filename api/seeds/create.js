import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";
import { generateSeedTag } from "../../lib/generateSeedTag.js";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  try {
    await dbConnect();

    const { name, variant, datePlanted, address } = req.body;

    if (!name || !datePlanted || !address) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // 1️⃣ Generate tag FIRST
    const tag = await generateSeedTag({ name, datePlanted });

    // 2️⃣ Save seed WITH tag
    const seed = await Seed.create({
      name,
      variant,
      datePlanted,
      address,
      tag,
    });

    return res.status(201).json(seed);

  } catch (err) {
    console.error("CREATE SEED ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
