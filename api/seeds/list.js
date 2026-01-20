import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";
import { auth } from "../../middleware/auth.js";
import { allow } from "../../middleware/allow.js";

const ROLES = ["admin", "rnd", "op-h", "op-non"];

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const user = auth(req);
    if (!user || !allow(user, ROLES)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const seeds = await Seed.find().sort({ createdAt: -1 });

    return res.status(200).json(seeds);
  } catch (err) {
    console.error("SEED LIST ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
