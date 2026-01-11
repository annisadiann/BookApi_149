import express from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import db from "../config/db.js";
import { checkApiKey } from "../middleware/apiKey.js";

const router = express.Router();

// === 1. REGISTER ===
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "Email sudah terdaftar" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'developer')",
      [name, email, hashedPassword]
    );
    
    const userId = result.insertId;
    
    const newApiKey = "sk_" + crypto.randomBytes(24).toString("hex");
    await db.query(
      "INSERT INTO api_keys (user_id, api_key, name, status) VALUES (?, ?, ?, 'active')",
      [userId, newApiKey, "Default Key"]
    );

    res.json({
      success: true,
      message: "Registrasi berhasil",
      data: { 
        user_id: userId,
        name: name,
        api_key: newApiKey
      }
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// === 2. LOGIN ===
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: "Email tidak ditemukan" });
    }

    const user = rows[0];
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: "Password salah" });
    }

    const [keyRows] = await db.query(
      "SELECT api_key FROM api_keys WHERE user_id = ? AND status = 'active' LIMIT 1", 
      [user.id]
    );
    
    let apiKey;
    if (keyRows.length === 0) {
      apiKey = "sk_" + crypto.randomBytes(24).toString("hex");
      await db.query(
        "INSERT INTO api_keys (user_id, api_key, name, status) VALUES (?, ?, ?, 'active')",
        [user.id, apiKey, "Auto-generated Key"]
      );
    } else {
      apiKey = keyRows[0].api_key;
    }
    
    res.json({
      success: true,
      message: "Login berhasil",
      data: { 
        user_id: user.id,
        name: user.name,
        role: user.role,
        api_key: apiKey
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// === 3. GET MY KEY ===
router.get("/my-keys", checkApiKey, async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    const [userCheck] = await db.query(
      "SELECT user_id FROM api_keys WHERE api_key = ? LIMIT 1",
      [apiKey]
    );
    
    if (userCheck.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid API Key" });
    }
    
    const userId = userCheck[0].user_id;
    
    const [keys] = await db.query(
      "SELECT id, api_key, name, status, created_at FROM api_keys WHERE user_id = ?",
      [userId]
    );
    
    res.json({ success: true, data: keys });
  } catch (error) {
    console.error("Get keys error:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil data key" });
  }
});

// === 4. REGENERATE KEY ===
router.post("/regenerate-key", checkApiKey, async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    const [userCheck] = await db.query(
      "SELECT user_id FROM api_keys WHERE api_key = ? LIMIT 1",
      [apiKey]
    );
    
    if (userCheck.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid API Key" });
    }
    
    const userId = userCheck[0].user_id;
    const { name } = req.body;
    const newApiKey = "sk_" + crypto.randomBytes(24).toString("hex");

    await db.query(
      "UPDATE api_keys SET api_key = ?, name = ? WHERE user_id = ?",
      [newApiKey, name || "Regenerated Key", userId]
    );

    res.json({ success: true, message: "API Key berhasil di-regenerate", api_key: newApiKey });
  } catch (error) {
    console.error("Regenerate key error:", error);
    res.status(500).json({ success: false, message: "Gagal regenerate key" });
  }
});

// === 5. GET ALL USERS (ADMIN ONLY) ===
router.get("/users", async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC"
    );
    res.json({ success: true, data: users });
  } catch (error) {
    console.error("Fetch users error:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil data pengguna" });
  }
});

export default router;