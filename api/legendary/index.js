import dbConnect from "../../lib/db.js";
import LegendaryBlock from "../../models/LegendaryBlock.js";

export default async function handler(req, res) {

  await dbConnect();

  try {

    // ========================
    // GET - LIST BLOCKS
    // ========================
    if (req.method === "GET") {

      const blocks = await LegendaryBlock.find()
        .sort({ createdAt: -1 });

      return res.json(blocks);
    }

    // ========================
    // POST - CREATE BLOCK
    // ========================
    if (req.method === "POST") {

      const { name, lots, slotsPerLot } = req.body;

      const block = await LegendaryBlock.create({
        name: name || "Legendary Block",
        lots: lots || 2,
        slotsPerLot: slotsPerLot || 200,
      });

      return res.json(block);
    }

    // ========================
    // DELETE - REMOVE BLOCK
    // ========================
    if (req.method === "DELETE") {

      const { id } = req.body;

      await LegendaryBlock.findByIdAndDelete(id);

      return res.json({ message: "Deleted successfully" });
    }

    // ========================
    // PUT - UPDATE BLOCK
    // ========================
    if (req.method === "PUT") {

      const { id, name, lots, slotsPerLot } = req.body;

      const updated = await LegendaryBlock.findByIdAndUpdate(
        id,
        { name, lots, slotsPerLot },
        { new: true }
      );

      return res.json(updated);
    }

    return res.status(405).json({ message: "Method not allowed" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
}