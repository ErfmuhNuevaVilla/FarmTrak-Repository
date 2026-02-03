const express = require("express");
const { pool } = require("../db/pool");
const { requireAuth } = require("../middleware/requireAuth");
const { requireRole } = require("../middleware/requireAuth");
const { HttpError } = require("../utils/httpError");

const buildingsRouter = express.Router();

// GET /api/buildings - List all buildings (accessible to all authenticated users)
buildingsRouter.get("/", requireAuth, async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, stock_count, created_at, updated_at
       FROM buildings
       ORDER BY name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// All other routes require manager role
buildingsRouter.use(requireAuth);
buildingsRouter.use(requireRole("manager"));

// POST /api/buildings - Create a new building
buildingsRouter.post("/", async (req, res, next) => {
  try {
    const name = String(req.body?.name || "").trim();
    const stockCount = Number(req.body?.stock_count || 0);

    if (!name) throw new HttpError(400, "Building name is required");
    if (isNaN(stockCount) || stockCount < 0)
      throw new HttpError(400, "Stock count must be a non-negative number");

    const result = await pool.query(
      `INSERT INTO buildings (name, stock_count)
       VALUES ($1, $2)
       RETURNING id, name, stock_count, created_at, updated_at`,
      [name, stockCount]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    // unique_violation
    if (err && err.code === "23505") {
      next(new HttpError(409, "Building name already exists"));
      return;
    }
    next(err);
  }
});

// PUT /api/buildings/:id/cull - Cull out a building (set stock_count to 0)
buildingsRouter.put("/:id/cull", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new HttpError(400, "Invalid building ID");

    const result = await pool.query(
      `UPDATE buildings
       SET stock_count = 0, updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, stock_count, updated_at`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new HttpError(404, "Building not found");
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/buildings/:id/stock - Update stock count for a building
buildingsRouter.put("/:id/stock", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const stockCount = Number(req.body?.stock_count || 0);

    if (isNaN(id)) throw new HttpError(400, "Invalid building ID");
    if (isNaN(stockCount) || stockCount < 0)
      throw new HttpError(400, "Stock count must be a non-negative number");

    const result = await pool.query(
      `UPDATE buildings
       SET stock_count = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, stock_count, updated_at`,
      [stockCount, id]
    );

    if (result.rows.length === 0) {
      throw new HttpError(404, "Building not found");
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/buildings/:id - Delete a building
buildingsRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new HttpError(400, "Invalid building ID");

    const result = await pool.query(
      `DELETE FROM buildings WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new HttpError(404, "Building not found");
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = { buildingsRouter };
