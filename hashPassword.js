// hashPassword.js
// Utility untuk generate password hash
// Jalankan: node hashPassword.js

import bcrypt from "bcrypt";

async function generateHash() {
  const password = "admin123"; // Ganti dengan password yang diinginkan
  const hash = await bcrypt.hash(password, 10);
  
  console.log("\n╔═══════════════════════════════════════╗");
  console.log("║       PASSWORD HASH GENERATOR         ║");
  console.log("╠═══════════════════════════════════════╣");
  console.log(`║  Password: ${password.padEnd(27)} ║`);
  console.log("╠═══════════════════════════════════════╣");
  console.log("║  Hash:                                ║");
  console.log(`║  ${hash}  ║`);
  console.log("╚═══════════════════════════════════════╝\n");
  
  console.log("📋 Copy hash di atas dan update di database:");
  console.log("UPDATE users SET password = '" + hash + "' WHERE email = 'admin@bookapi.com';\n");
}

generateHash();