const express = require("express");
const { pool } = require("../db/pool");
const { requireAuth } = require("../middleware/requireAuth");
const { requireRole } = require("../middleware/requireAuth");
const { HttpError } = require("../utils/httpError");

const reportsRouter = express.Router();

// GET /api/reports - List all reports (accessible to managers)
reportsRouter.get("/", requireAuth, requireRole("manager"), async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
        r.id,
        r.submitted_by,
        r.report_type,
        r.data_value,
        r.created_at,
        b.name AS building_name,
        b.id AS building_id
       FROM reports r
       INNER JOIN buildings b ON r.building_id = b.id
       ORDER BY r.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/my-reports - List worker's own reports (accessible to workers)
reportsRouter.get("/my-reports", requireAuth, requireRole("worker"), async (req, res, next) => {
  try {
    const submittedBy = req.auth?.name;
    if (!submittedBy) {
      throw new HttpError(400, "Worker name not found in token");
    }

    const result = await pool.query(
      `SELECT 
        r.id,
        r.submitted_by,
        r.report_type,
        r.data_value,
        r.created_at,
        b.name AS building_name,
        b.id AS building_id
       FROM reports r
       INNER JOIN buildings b ON r.building_id = b.id
       WHERE r.submitted_by = $1
       ORDER BY r.created_at DESC`,
      [submittedBy]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// All POST routes require authentication and worker role
reportsRouter.use(requireAuth);
reportsRouter.use(requireRole("worker"));

// POST /api/reports/harvest - Record egg harvest
reportsRouter.post("/harvest", async (req, res, next) => {
  try {
    const buildingId = Number(req.body?.building_id || 0);
    const eggs = Number(req.body?.eggs || 0);
    const submittedBy = req.auth?.name || "Unknown";

    if (!buildingId || isNaN(buildingId))
      throw new HttpError(400, "Building is required");
    if (isNaN(eggs) || eggs < 0)
      throw new HttpError(400, "Egg count must be a non-negative number");

    const result = await pool.query(
      `INSERT INTO reports (submitted_by, report_type, building_id, data_value)
       VALUES ($1, $2, $3, $4)
       RETURNING id, submitted_by, report_type, building_id, data_value, created_at`,
      [submittedBy, "Egg Harvest", buildingId, eggs]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    // foreign_key_violation
    if (err && err.code === "23503") {
      next(new HttpError(400, "Invalid building selected"));
      return;
    }
    next(err);
  }
});

// POST /api/reports/feed - Record feed usage
reportsRouter.post("/feed", async (req, res, next) => {
  try {
    const buildingId = Number(req.body?.building_id || 0);
    const feedKg = Number(req.body?.feedKg || 0);
    const submittedBy = req.auth?.name || "Unknown";

    if (!buildingId || isNaN(buildingId))
      throw new HttpError(400, "Building is required");
    if (isNaN(feedKg) || feedKg < 0)
      throw new HttpError(400, "Feed amount must be a non-negative number");

    const result = await pool.query(
      `INSERT INTO reports (submitted_by, report_type, building_id, data_value)
       VALUES ($1, $2, $3, $4)
       RETURNING id, submitted_by, report_type, building_id, data_value, created_at`,
      [submittedBy, "Feed Usage", buildingId, feedKg]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    // foreign_key_violation
    if (err && err.code === "23503") {
      next(new HttpError(400, "Invalid building selected"));
      return;
    }
    next(err);
  }
});

// POST /api/reports/mortality - Record mortality
reportsRouter.post("/mortality", async (req, res, next) => {
  try {
    const buildingId = Number(req.body?.building_id || 0);
    const count = Number(req.body?.count || 0);
    const submittedBy = req.auth?.name || "Unknown";

    if (!buildingId || isNaN(buildingId))
      throw new HttpError(400, "Building is required");
    if (isNaN(count) || count < 0)
      throw new HttpError(400, "Mortality count must be a non-negative number");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Lock building row so stock_count can't change during this operation
      const buildingRes = await client.query(
        `SELECT id, name, stock_count
         FROM buildings
         WHERE id = $1
         FOR UPDATE`,
        [buildingId]
      );

      const building = buildingRes.rows[0];
      if (!building) throw new HttpError(400, "Invalid building selected");

      const currentStock = Number(building.stock_count) || 0;
      if (count > currentStock) {
        throw new HttpError(
          400,
          `Mortality count (${count}) cannot exceed current livestock (${currentStock})`
        );
      }

      const reportRes = await client.query(
        `INSERT INTO reports (submitted_by, report_type, building_id, data_value)
         VALUES ($1, $2, $3, $4)
         RETURNING id, submitted_by, report_type, building_id, data_value, created_at`,
        [submittedBy, "Mortality", buildingId, count]
      );

      const updatedBuildingRes = await client.query(
        `UPDATE buildings
         SET stock_count = stock_count - $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id, name, stock_count, updated_at`,
        [count, buildingId]
      );

      await client.query("COMMIT");

      res.status(201).json({
        report: reportRes.rows[0],
        building: updatedBuildingRes.rows[0],
      });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    // foreign_key_violation
    if (err && err.code === "23503") {
      next(new HttpError(400, "Invalid building selected"));
      return;
    }
    next(err);
  }
});

module.exports = { reportsRouter };
