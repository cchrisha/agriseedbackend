import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";

export default async function handler(req, res) {
  await dbConnect();

  const seeds = await Seed.find({}, { block: 1, lot: 1 });

  const occupied = seeds.map(s => ({
    block: s.block,
    lot: s.lot,
  }));

  res.json(occupied);
}
