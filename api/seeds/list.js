import dbConnect from "../../../lib/db.js";
import SeedTransaction from "../../../models/SeedTransaction.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const transactions = await SeedTransaction.find({ type: "add" })
      .populate("seed")
      .sort({ createdAt: -1 });

    const result = [];

    transactions.forEach(tx => {
      if (!tx.seed) return; // 🔑 prevents Vercel crash

      for (let i = 1; i <= tx.quantity; i++) {
        result.push({
          id: `${tx._id}-${i}`,
          seedName: tx.seed.name,
          number: i,
          displayName: `${tx.seed.name} ${i}`,
          tag: `${tx.tag}-${String(i).padStart(3, "0")}`,
          batchTag: tx.tag,
          block: tx.block,
          lot: tx.lot,
          createdAt: tx.createdAt,
        });
      }
    });

    return res.status(200).json(result);

  } catch (err) {
    console.error("GET SEEDS ERROR:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
}
