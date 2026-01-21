import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  try {
    await dbConnect();

    const { name, variety, datePlanted, address } = req.body;

    if (!name || !datePlanted || !address) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const seed = await Seed.create({
      name,
      variety,
      datePlanted,
      address,
    });

    return res.status(201).json(seed);

  } catch (err) {
    console.error("CREATE SEED ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
