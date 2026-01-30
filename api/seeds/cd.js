import dbConnect from "../../lib/db.js";
import Seed from "../../models/Seed.js";
import ActivityLog from "../../models/ActivityLog.js";

export default async function handler(req,res){
await dbConnect();

const role=req.headers.role||"admin";
const user=req.headers.user||"System";

try{

if(req.method==="POST"){

const {name,variety,datePlanted,address}=req.body;

if(!name||!datePlanted||!address)
return res.status(400).json({message:"Missing fields"});

const seedCode=name.substring(0,3).toUpperCase();
const d=new Date(datePlanted);

const year=d.getFullYear();
const month=String(d.getMonth()+1).padStart(2,"0");
const day=String(d.getDate()).padStart(2,"0");

const count=await Seed.countDocuments();
const batch=String(count+1).padStart(2,"0");

const tag=`PRB-${seedCode}-${year}-${month}-${day}-B${batch}`;

const seed=await Seed.create({
name,variety,datePlanted,address,tag,isDeleted:false
});

await ActivityLog.create({
user,role,seed:seed._id,seedName:seed.name,seedTag:seed.tag,
quantity:0,process:"CREATED"
});

return res.status(201).json(seed);
}

if(req.method==="DELETE"){

const {seedId}=req.body;

const seed=await Seed.findById(seedId);
if(!seed)return res.status(404).json({message:"Seed not found"});

seed.isDeleted=true;
seed.deletedAt=new Date();
await seed.save();

await ActivityLog.create({
user,role,seed:seed._id,seedName:seed.name,seedTag:seed.tag,
quantity:0,process:"DELETED"
});

return res.json({message:"Seed soft deleted"});
}

res.status(405).json({message:"Method not allowed"});

}catch(e){
console.error(e);
res.status(500).json({message:e.message});
}
}
