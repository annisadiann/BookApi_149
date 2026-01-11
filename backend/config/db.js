import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "@nnisa041204",
  database: "book_api_db",
  port: 3309
});

export default db;