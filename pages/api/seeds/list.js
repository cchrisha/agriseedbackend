import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";
import { auth } from "../../middleware/auth.js";
import { allow } from "../../middleware/allow.js";

const ROLES = ["admin", "rnd", "op-h", "op-non"];

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ message: "Method not allowed" });

  await dbConnect();

  const user = auth(req);
  if (!user || !allow(user, ROLES))
    return res.status(401).json({ message: "Unauthorized" });

  const seeds = await Seed.find().sort({ createdAt: -1 });
  res.json(seeds);
}
