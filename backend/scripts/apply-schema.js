require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { pool } = require("../src/db/pool");

async function main() {
  const schemaPath = path.join(__dirname, "..", "db", "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");

  await pool.query(sql);
  await pool.end();

  // eslint-disable-next-line no-console
  console.log("Schema applied successfully.");
}

main().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  try {
    await pool.end();
  } catch (_) {
    // ignore
  }
  process.exit(1);
});

