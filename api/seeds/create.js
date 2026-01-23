import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const {
      name,
      variant,
      block,
      lot,
      datePlanted,
      address,
    } = req.body;

    if (!name || !block || !lot || !datePlanted || !address) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // 🔍 Check kung occupied na ang block + lot
    const occupied = await Seed.findOne({ block, lot });
    if (occupied) {
      return res
        .status(400)
        .json({ message: "Block and lot already occupied" });
    }

    // ===============================
    // 🏷️ GENERATE SEED TAG
    // ===============================
    const seedCode = name.substring(0, 3).toUpperCase(); // TAM
    const d = new Date(datePlanted);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    // Start & end of month
    const startOfMonth = new Date(year, d.getMonth(), 1);
    const endOfMonth = new Date(year, d.getMonth() + 1, 0, 23, 59, 59);

    // Count seeds this month (for batch)
    const batchCount = await Seed.countDocuments({
      datePlanted: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    });

    const batchNo = `BO${batchCount + 1}`;

    const tag = `PRB-${seedCode}-${year}-${month}-${day}-${batchNo}`;

    // ===============================
    // 🌱 CREATE SEED
    // ===============================
    const seed = await Seed.create({
      name,
      variant,
      block,
      lot,
      datePlanted,
      address,
      tag, // 👈 SAVE TAG
    });

    res.status(201).json(seed);
  } catch (err) {
    console.error("CREATE SEED ERROR:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        message: "Duplicate seed or block/lot already used",
      });
    }

    res.status(500).json({ message: "Server error" });
  }
}
