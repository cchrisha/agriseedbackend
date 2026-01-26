import dbConnect from "../../lib/db.js";
import SeedStock from "../../models/SeedStock.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { seedId, quantity } = req.body;

    if (!seedId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "Invalid input" });
    }

    // Get AVAILABLE stocks
    const availableStocks = await SeedStock.find({
      seed: seedId,
      status: "STOCK-IN",
    })
      .sort({ stockNo: 1 })
      .limit(quantity);

    if (availableStocks.length < quantity) {
      return res.status(400).json({
        message: "Not enough stocks for replacement",
      });
    }

    const ids = availableStocks.map(s => s._id);

    await SeedStock.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          status: "REPLACED",
        },
      }
    );

    res.status(200).json({
      message: "Replacement successful",
      from: availableStocks[0].stockNo,
      to: availableStocks[availableStocks.length - 1].stockNo,
      quantity,
    });
  } catch (err) {
    console.error("REPLACED ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
}
