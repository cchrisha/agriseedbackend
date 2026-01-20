import dbConnect from "../../lib/db.js";
import SeedTransaction from "../../models/SeedTransaction.js";
import { auth } from "../../middleware/auth.js";
import { allow } from "../../middleware/allow.js";

const ROLES = ["admin", "rnd", "op-h", "op-non"];

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ message: "Method not allowed" });

  try {
    await dbConnect();

    const user = auth(req);
    if (!user || !allow(user, ROLES))
      return res.status(401).json({ message: "Unauthorized" });

    const { seedId } = req.query;

    const txs = await SeedTransaction.find({ seed: seedId });

    let stock = 0;
    for (const tx of txs) {
      if (tx.type === "add") stock += tx.quantity;
      if (tx.type === "mortality") stock -= tx.quantity;
      if (tx.type === "distribute") stock -= tx.quantity;
    }

    res.json({ seedId, stock });
  } catch (err) {
    console.error("STOCK ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
}
