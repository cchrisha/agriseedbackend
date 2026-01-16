// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");
// require("dotenv").config();

// const User = require("./models/User");

// async function main() {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);

//     const exists = await User.findOne({ email: "admin@gmail.com" });
//     if (exists) {
//       console.log("Admin already exists");
//       process.exit();
//     }

//     const passwordHash = await bcrypt.hash("admin123", 10);

//     await User.create({
//       name: "Admin",
//       email: "admin@gmail.com",
//       password: passwordHash,
//       role: "admin"
//     });

//     console.log("Admin account created successfully!");
//     process.exit();
//   } catch (err) {
//     console.error(err);
//     process.exit(1);
//   }
// }

// main();
