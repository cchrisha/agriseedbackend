import dbConnect from "../../lib/db.js";
import SeedStock from "../../models/SeedStock.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { stockIds } = req.body; // array ng stock _id

    if (!stockIds || stockIds.length === 0) {
      return res.status(400).json({ message: "No stocks provided" });
    }

    await SeedStock.updateMany(
      { _id: { $in: stockIds } },
      {
        $set: {
          status: "MORTALITY",
        },
      }
    );

    res.status(200).json({
      message: "Stocks marked as mortality",
      count: stockIds.length,
    });
  } catch (err) {
    console.error("MORTALITY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
}
