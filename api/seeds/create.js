import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";
import { generateSeedTag } from "../../lib/generateSeedTag.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { name, variant, datePlanted, address } = req.body;

    if (!name || !datePlanted || !address) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const tag = await generateSeedTag({
      name,
      datePlanted,
      address,
    });

    const seed = await Seed.create({
      name,
      variant,
      datePlanted,
      address,
      tag,
    });

    res.status(201).json(seed);
  } catch (err) {
    console.error("CREATE SEED ERROR:", err);

    if (err.code === 11000) {
      return res.status(400).json({ message: "Duplicate seed tag" });
    }

    res.status(500).json({ message: "Server error" });
  }
}
