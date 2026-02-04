import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";
import Lot from "../../models/Lot.js";

export default async function handler(req,res){

 if(req.method!=="GET")
  return res.status(405).json({message:"Method not allowed"});

 try{

  await dbConnect();

  const seeds = await Seed.find({
   $or:[{isDeleted:false},{isDeleted:{$exists:false}}]
  });

  const lots = await Lot.find().populate("seed");

  return res.json({ seeds, lots });

 }catch(err){
  console.error(err);
  res.status(500).json({message:err.message});
 }
}
