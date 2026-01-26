// import dbConnect from "../../lib/db.js";
// import SeedStock from "../../models/SeedStock.js";

// export default async function handler(req, res) {
//   if (req.method !== "GET") {
//     return res.status(405).json({ message: "Method not allowed" });
//   }

//   try {
//     await dbConnect();

//     const { seedId } = req.query;

//     if (!seedId) {
//       return res.status(400).json({ message: "Seed ID required" });
//     }

//     const stocks = await SeedStock.find({ seed: seedId })
//       .sort({ stockNo: 1 });

//     res.json(stocks);
//   } catch (err) {
//     console.error("FETCH STOCK ERROR:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// }
