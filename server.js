import path from "path";
import { fileURLToPath } from "url";
import fs from "fs"; 
import express from "express";
import cors from "cors";

// Import Routes
import authRoutes from "./backend/routes/auth.js";
import bookRoutes from "./backend/routes/books.js";
import categoryRoutes from "./backend/routes/categories.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

// Middleware Dasar
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 1. OTOMATIS BUAT FOLDER UPLOADS ---
const uploadDir = path.join(__dirname, 'frontend/uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// --- 2. AKSES FILE STATIS ---
app.use(express.static(path.join(__dirname, 'frontend')));
app.use('/uploads', express.static(uploadDir));

// --- 3. DAFTARKAN RUTE API ---
// Rute Utama
app.use("/api/auth", authRoutes); 
app.use("/api/books", bookRoutes);
app.use("/api/categories", categoryRoutes);

// Alias agar kompatibel dengan Fetch di Frontend
app.use("/api/users", authRoutes); 
app.post("/api/login", (req, res, next) => { req.url = '/login'; next(); }, authRoutes);
app.post("/api/register", (req, res, next) => { req.url = '/register'; next(); }, authRoutes);

// --- 4. DOKUMENTASI JSON API ---
app.get("/api/docs-json", (req, res) => {
    res.json({ 
        success: true, 
        version: "1.0.0",
        endpoints: [
            {
                group: "Authentication",
                routes: [
                    { method: "POST", path: "/api/auth/register", description: "Mendaftarkan developer baru" },
                    { method: "POST", path: "/api/auth/login", description: "Masuk ke sistem" },
                    { method: "GET", path: "/api/auth/my-keys", description: "Melihat daftar API Key aktif" },
                    { method: "POST", path: "/api/auth/regenerate-key", description: "Memperbarui API Key" }
                ]
            },
            {
                group: "Library Books",
                routes: [
                    { method: "GET", path: "/api/books", description: "Mengambil katalog semua buku" },
                    { method: "POST", path: "/api/books", description: "Menambahkan koleksi buku baru" },
                    { method: "PUT", path: "/api/books/:id", description: "Memperbarui data buku" },
                    { method: "DELETE", path: "/api/books/:id", description: "Menghapus buku dari database" }
                ]
            }
        ]
    });
});

// --- 5. ROUTING DOKUMENTASI & HALAMAN UTAMA ---
const serveDocs = (req, res) => res.sendFile(path.join(__dirname, "frontend/docs.html"));

app.get("/docs", serveDocs);
app.get("/api/docs", serveDocs);
app.get("/documentation", serveDocs);

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "frontend/index.html")));
app.get("/developer", (req, res) => res.sendFile(path.join(__dirname, "frontend/developer.html")));
app.get("/playground", (req, res) => res.sendFile(path.join(__dirname, "frontend/playground.html")));

// Handler Otomatis untuk file .html lainnya (Admin Dashboard, dll)
app.get("/:page", (req, res, next) => {
    if (req.params.page.startsWith('api')) return next();
    
    const page = req.params.page.endsWith('.html') ? req.params.page : `${req.params.page}.html`;
    const filePath = path.join(__dirname, 'frontend', page);
    
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        next();
    }
});

// --- 6. HANDLE 404 (CUSTOM PREMIUM THEME) ---
app.use((req, res) => {
    // Jika request API yang salah
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ 
            success: false, 
            message: "Endpoint API tidak ditemukan",
            help: "Silakan cek dokumentasi di /docs"
        });
    }
    
    // Jika halaman web yang tidak ada (Tampilan Modern)
    res.status(404).send(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <title>404 - Halaman Hilang</title>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&display=swap" rel="stylesheet">
            <style>
                body { 
                    background: #030712; color: white; font-family: 'Plus Jakarta Sans', sans-serif;
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    height: 100vh; margin: 0; text-align: center;
                }
                h1 { font-size: 8rem; margin: 0; background: linear-gradient(to right, #00d2ff, #0066ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                p { font-size: 1.2rem; color: #94a3b8; margin-bottom: 30px; }
                a { 
                    text-decoration: none; color: #000; background: #00d2ff; 
                    padding: 12px 30px; border-radius: 12px; font-weight: 800;
                    transition: 0.3s;
                }
                a:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0, 210, 255, 0.3); }
            </style>
        </head>
        <body>
            <h1>404</h1>
            <p>Sepertinya buku yang Anda cari tidak ada di rak kami.</p>
            <a href="/">KEMBALI KE BERANDA</a>
        </body>
        </html>
    `);
});

// --- 7. GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
    console.error(' [!] Server Error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error'
    });
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`\n 🚀  SERVER STARTED`);
    console.log(` 🔗  URL: http://localhost:${PORT}`);
    console.log(` 📂  Uploads: ${uploadDir}`);
    console.log(` 📚  Documentation: http://localhost:${PORT}/docs\n`);
});