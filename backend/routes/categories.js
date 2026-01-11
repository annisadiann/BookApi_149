import express from "express";
import db from "../config/db.js";
import { checkApiKey } from "../middleware/apiKey.js";

const router = express.Router();

/**
 * GET ALL CATEGORIES - DENGAN SEARCH
 */
router.get("/", checkApiKey, async (req, res) => {
  try {
    const { search } = req.query;
    
    let query = `
      SELECT 
        c.id,
        c.name,
        COUNT(b.id) AS jumlah_buku
      FROM categories c
      LEFT JOIN books b ON c.id = b.category_id
    `;
    const params = [];
    
    // Jika ada parameter search, filter berdasarkan nama kategori
    if (search) {
      query += " WHERE c.name LIKE ?";
      params.push(`%${search}%`);
    }
    
    query += " GROUP BY c.id, c.name ORDER BY c.id ASC";
    
    const [categories] = await db.query(query, params);
    
    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
});

/**
 * CREATE CATEGORY (ADMIN ONLY)
 */
router.post("/", checkApiKey, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Category name is required" });

    const [existing] = await db.query("SELECT id FROM categories WHERE name = ?", [name]);
    if (existing.length > 0) return res.status(409).json({ success: false, message: "Category already exists" });

    const [result] = await db.query("INSERT INTO categories (name) VALUES (?)", [name]);

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: { id: result.insertId, name: name }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * UPDATE CATEGORY (ADMIN ONLY)
 */
router.put("/:id", checkApiKey, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ success: false, message: "Admin access required" });
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Name required" });

    const [existing] = await db.query("SELECT id FROM categories WHERE id = ?", [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: "Not found" });

    await db.query("UPDATE categories SET name = ? WHERE id = ?", [name, req.params.id]);
    res.json({ success: true, message: "Category updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * DELETE CATEGORY (ADMIN ONLY)
 */
router.delete("/:id", checkApiKey, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ success: false, message: "Admin access required" });
    const [books] = await db.query("SELECT COUNT(*) as count FROM books WHERE category_id = ?", [req.params.id]);
    if (books[0].count > 0) return res.status(409).json({ success: false, message: "Category is in use" });

    await db.query("DELETE FROM categories WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;