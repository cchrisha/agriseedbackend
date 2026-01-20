import dbConnect from "../../lib/db.js";
import SeedTransaction from "../../models/SeedTransaction.js";
import { auth } from "../../middleware/auth.js";
import { allow } from "../../middleware/allow.js";

const ROLES = ["admin", "rnd", "op-h", "op-non"];

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  await dbConnect();

  const user = auth(req);
  if (!user || !allow(user, ROLES))
    return res.status(401).json({ message: "Unauthorized" });

  const { seedId, quantity, block, lot, remarks } = req.body;

  const tx = await SeedTransaction.create({
    seed: seedId,
    type: "add",
    quantity,
    block,
    lot,
    metadata: { remarks },
  });

  res.status(201).json(tx);
}
