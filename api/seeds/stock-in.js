// import dbConnect from "../../lib/db.js";
// import Seed from "../../models/Seed.js";
// import SeedStock from "../../models/SeedStock.js";

// export default async function handler(req, res) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ message: "Method not allowed" });
//   }

//   try {
//     await dbConnect();

//     const { seedId, quantity } = req.body;

//     if (!seedId || !quantity || quantity <= 0) {
//       return res.status(400).json({ message: "Invalid input" });
//     }

//     const seed = await Seed.findById(seedId);
//     if (!seed) {
//       return res.status(404).json({ message: "Seed not found" });
//     }

//     // 🔢 get last stock number
//     const lastStock = await SeedStock.findOne({ seed: seedId })
//       .sort({ stockNo: -1 });

//     const startNo = lastStock ? lastStock.stockNo + 1 : 1;
//     const endNo = startNo + quantity - 1;

//     const stocks = [];

//     for (let i = startNo; i <= endNo; i++) {
//       stocks.push({
//         seed: seedId,
//         stockNo: i,
//         tag: `${seed.tag}-${i}`,
//       });
//     }

//     await SeedStock.insertMany(stocks);

//     res.status(201).json({
//       message: "Stock added successfully",
//       from: startNo,
//       to: endNo,
//     });
//   } catch (err) {
//     console.error("ADD STOCK ERROR:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// }
