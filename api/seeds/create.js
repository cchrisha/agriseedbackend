import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";
import { auth } from "../../middleware/auth.js";
import { allow } from "../../middleware/allow.js";

const ROLES = ["admin", "rnd", "op-h", "op-non"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const user = auth(req);
    if (!user || !allow(user, ROLES)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

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

    res.status(201).json(seed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}
