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

      const batches = await SeedTransaction.find({
        seed: seedId,
        type: "add",
      })
        .select("tag quantity block lot createdAt")
        .sort({ createdAt: 1 }); // oldest → newest

      return res.status(200).json(batches);

    } catch (err) {
      console.error("BATCH LIST ERROR:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
