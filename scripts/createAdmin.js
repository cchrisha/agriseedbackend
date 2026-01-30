// import bcrypt from "bcryptjs";
// import dbConnect from "../lib/db.js";
// import User from "../models/User.js";



// async function createAdmin() {
//   await dbConnect();

//   const email = "admin@gmail.com";
//   const password = "admin123";

//   const exists = await User.findOne({ email });

//   if (exists) {
//     console.log("✅ Admin already exists");
//     process.exit();
//   }

//   const hashed = await bcrypt.hash(password, 10);

//   await User.create({
//     email,
//     password: hashed,
//     role: "admin",
//     name: "Admin",
//   });

//   console.log("🔥 Admin created");
//   process.exit();
// }

// createAdmin();
