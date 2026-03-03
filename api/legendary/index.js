import dbConnect from "../../lib/db.js";
import LegendaryBlock from "../../models/LegendaryBlock.js";
import Lot from "../../models/Lot.js";

export default async function handler(req, res) {
  await dbConnect();

  try {
    // ========================
    // GET - LIST BLOCKS
    // ========================
    if (req.method === "GET") {
      const blocks = await LegendaryBlock.find()
        .sort({ blockNumber: 1 });

      return res.json(blocks);
    }

    // ========================
    // POST - CREATE BLOCK
    // ========================
    if (req.method === "POST") {
      const { name, lots, slotsPerLot } = req.body;

      // 🔥 Get highest blockNumber
      const lastBlock = await LegendaryBlock.findOne()
        .sort({ blockNumber: -1 });

      // Start legendary at 100
      const nextBlockNumber = lastBlock
        ? lastBlock.blockNumber + 1
        : 100;

      // Create Legendary Block
      const block = await LegendaryBlock.create({
        name: name || "Legendary Block",
        blockNumber: nextBlockNumber,
        lots: lots || 2,
        slotsPerLot: slotsPerLot || 200,
      });

      // 🔥 Auto create Lot documents
      for (let i = 1; i <= block.lots; i++) {
        await Lot.create({
          block: block.blockNumber,
          lot: i,
        });
      }

      return res.json(block);
    }

    // ========================
    // DELETE - REMOVE BLOCK
    // ========================
    if (req.method === "DELETE") {
      const { id } = req.body;

      const block = await LegendaryBlock.findById(id);

      if (!block)
        return res.status(404).json({ message: "Block not found" });

      // 🔥 Optional safety: check if any lot has seed
      const plantedLot = await Lot.findOne({
        block: block.blockNumber,
        seed: { $ne: null },
      });

      if (plantedLot) {
        return res.status(400).json({
          message: "Cannot delete block with planted seeds",
        });
      }

      // Delete lots first
      await Lot.deleteMany({
        block: block.blockNumber,
      });

      // Delete block
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