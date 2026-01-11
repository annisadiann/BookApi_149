import db from "../config/db.js";

export async function checkApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({ success: false, message: "API Key required" });
  }

  try {
    const [rows] = await db.query(`
      SELECT api_keys.*, users.role
      FROM api_keys
      JOIN users ON users.id = api_keys.user_id
      WHERE api_key = ? AND status = 'active'
    `, [apiKey]);

    if (rows.length === 0) {
      return res.status(403).json({ success: false, message: "Invalid or Inactive API Key" });
    }

    req.user = rows[0]; // role: admin / developer
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: "Database error" });
  }
}