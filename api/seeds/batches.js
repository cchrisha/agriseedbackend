import dbConnect from "../../lib/db.js";
import SeedTransaction from "../../models/SeedTransaction.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { seedId } = req.query;
    if (!seedId) {
      return res.status(400).json({ message: "seedId is required" });
    }

    const transactions = await SeedTransaction.find({ seed: seedId })
      .populate("seed", "name")
      .sort({ createdAt: 1 });

    const expanded = [];

    for (const tx of transactions) {
      for (let i = 1; i <= tx.quantity; i++) {
        expanded.push({
          _id: `${tx._id}-${i}`,
          name: tx.seed?.name || "",
          tag: `${tx.tag}-${i}`,
          block: tx.block,
          lot: tx.lot,
          createdAt: tx.createdAt,
        });
      }
    }

    res.json(expanded);

  } catch (err) {
    console.error("BATCHES ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
}
