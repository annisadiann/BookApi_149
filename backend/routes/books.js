import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../config/db.js";
import { checkApiKey } from "../middleware/apiKey.js";

const router = express.Router();

// --- 1. KONFIGURASI MULTER (UPLOAD FOTO) ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "frontend/uploads/";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Batas 2MB
});

/**
 * 2. GET ALL BOOKS (DIPERBAIKI: Search di Category juga)
 */
router.get("/", checkApiKey, async (req, res) => {
  try {
    const { category_id, search, limit = 100, page = 1 } = req.query;
    
    let query = `
      SELECT books.*, categories.name AS category
      FROM books
      LEFT JOIN categories ON categories.id = books.category_id
      WHERE 1=1
    `;
    const params = [];

    if (category_id) {
      query += " AND books.category_id = ?";
      params.push(category_id);
    }

    if (search) {
      query += " AND (books.title COLLATE utf8mb4_general_ci LIKE ? OR books.author COLLATE utf8mb4_general_ci LIKE ? OR categories.name COLLATE utf8mb4_general_ci LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const offset = (page - 1) * limit;
    query += " ORDER BY books.id DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const [books] = await db.query(query, params);
    res.json({ success: true, data: books });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 3. CREATE BOOK (DIPERBAIKI: Menambahkan Description)
 */
router.post("/", checkApiKey, upload.single("image"), async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const { title, author, publisher, year, category_id, isbn, description } = req.body;
    const image = req.file ? req.file.filename : null;

    if (!title || !author) {
      return res.status(400).json({ success: false, message: "Title and author are required" });
    }

    const [result] = await db.query(
      `INSERT INTO books 
       (title, author, publisher, year, category_id, isbn, description, image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, 
        author, 
        publisher || null, 
        year || null, 
        category_id || null, 
        isbn || null, 
        description || null, 
        image
      ]
    );

    res.status(201).json({ 
      success: true, 
      message: "Book created successfully",
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Gagal simpan: " + error.message });
  }
});

/**
 * 4. UPDATE BOOK (DIPERBAIKI: Menambahkan Description)
 */
router.put("/:id", checkApiKey, upload.single("image"), async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const { id } = req.params;
    const { title, author, publisher, year, category_id, isbn, description } = req.body;
    
    const [existing] = await db.query("SELECT image FROM books WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    let query = `UPDATE books SET title=?, author=?, publisher=?, year=?, category_id=?, isbn=?, description=?`;
    let params = [title, author, publisher, year, category_id, isbn, description];

    if (req.file) {
      query += `, image=?`;
      params.push(req.file.filename);
      
      if (existing[0].image) {
        const oldPath = path.join("frontend/uploads/", existing[0].image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    query += ` WHERE id=?`;
    params.push(id);

    await db.query(query, params);
    res.json({ success: true, message: "Book updated successfully" });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 5. DELETE BOOK
 */
router.delete("/:id", checkApiKey, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const [book] = await db.query("SELECT image FROM books WHERE id = ?", [req.params.id]);
    
    if (book.length > 0 && book[0].image) {
      const imgPath = path.join("frontend/uploads/", book[0].image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await db.query("DELETE FROM books WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Book deleted successfully" });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;