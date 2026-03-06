import dbConnect from "../../lib/db.js";
import LegendaryBlock from "../../models/LegendaryBlock.js";
import Lot from "../../models/Lot.js";

export default async function handler(req, res) {

  await dbConnect();

  try {

    // =====================================
    // GET - LIST ALL BLOCKS
    // =====================================
    if (req.method === "GET") {

      const blocks = await LegendaryBlock
        .find()
        .sort({ blockNumber: 1 });

      return res.status(200).json(blocks);
    }

    // =====================================
    // POST - CREATE LEGENDARY BLOCK
    // =====================================
    if (req.method === "POST") {

      const { name, lots, slotsPerLot } = req.body;

      // Get last block
      const lastBlock = await LegendaryBlock
        .findOne()
        .sort({ blockNumber: -1 });

      // Auto increment
      const nextBlockNumber = lastBlock
        ? lastBlock.blockNumber + 1
        : 100;

      // Create block
      const block = await LegendaryBlock.create({
        name: name || "Legendary Block",
        blockNumber: nextBlockNumber,
        lots: lots || 2,
        slotsPerLot: slotsPerLot || 200,
      });

      // Auto create lots
      for (let i = 1; i <= block.lots; i++) {

        await Lot.create({
          block: block.blockNumber,
          lot: i,
          seed: null,
        });

      }

      return res.status(200).json({
        message: "Legendary block created",
        data: block
      });
    }

    // =====================================
    // PUT - UPDATE BLOCK
    // =====================================
    if (req.method === "PUT") {

      const { id, name, lots, slotsPerLot } = req.body;

      const updated = await LegendaryBlock.findByIdAndUpdate(
        id,
        {
          name,
          lots,
          slotsPerLot,
        },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({
          message: "Block not found"
        });
      }

      return res.status(200).json({
        message: "Block updated",
        data: updated
      });
    }

    // =====================================
    // DELETE BLOCK
    // =====================================
    if (req.method === "DELETE") {

      const { id } = req.body;

      const block = await LegendaryBlock.findById(id);

      if (!block) {
        return res.status(404).json({
          message: "Block not found"
        });
      }

      // Check if any lot has seed
      const plantedLot = await Lot.findOne({
        block: block.blockNumber,
        seed: { $ne: null }
      });

      if (plantedLot) {
        return res.status(400).json({
          message: "Cannot delete block with planted seeds"
        });
      }

      // Delete lots
      await Lot.deleteMany({
        block: block.blockNumber
      });

      // Delete block
      await LegendaryBlock.findByIdAndDelete(id);

      return res.status(200).json({
        message: "Block deleted successfully"
      });
    }

    // =====================================
    // METHOD NOT ALLOWED
    // =====================================
    return res.status(405).json({
      message: "Method not allowed"
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: error.message
    });

  }
}