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

    // 1️⃣ CREATE SEED FIRST
    const seed = await Seed.create({
      name,
      variant,
      datePlanted,
      address,
    });

    // 2️⃣ GENERATE TAG (IMPORTANT: await)
    const tag = await generateSeedTag({
      name,
      datePlanted,
      primaryKey: seed._id.toString(),
    });

    // 3️⃣ SAVE TAG
    seed.tag = tag;
    await seed.save();

    return res.status(201).json(seed);

  } catch (err) {
    console.error("CREATE SEED ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
