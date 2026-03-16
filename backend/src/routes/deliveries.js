const express = require("express");
const { pool } = require("../db/pool");
const { requireAuth } = require("../middleware/requireAuth");
const { requireRole } = require("../middleware/requireAuth");
const { HttpError } = require("../utils/httpError");

const deliveriesRouter = express.Router();

// GET /api/deliveries - List all deliveries (accessible to managers)
deliveriesRouter.get("/", requireAuth, requireRole("manager"), async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
        d.id,
        d.submitted_by,
        d.worker_name,
        d.client,
        d.egg_trays,
        d.feed_bags,
        d.delivery_type,
        d.created_at,
        d.user_id
       FROM deliveries d
       ORDER BY d.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/deliveries - Create new delivery (accessible to workers and managers)
deliveriesRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const {
      client,
      egg_trays,
      feed_bags,
      delivery_type,
      worker_name
    } = req.body;

    const submittedBy = req.auth?.name || "Unknown";
    const userId = req.auth?.id;

    if (!client || client.trim() === "") {
      throw new HttpError(400, "Client name is required");
    }
    if (!delivery_type || !["Outgoing Eggs", "Ingoing Feed"].includes(delivery_type)) {
      throw new HttpError(400, "Delivery type must be 'Outgoing Eggs' or 'Ingoing Feed'");
    }

    // Validate based on delivery type
    if (delivery_type === "Outgoing Eggs") {
      if (isNaN(egg_trays) || egg_trays < 0 || !Number.isInteger(Number(egg_trays))) {
        throw new HttpError(400, "Egg trays must be a non-negative whole number");
      }
      if (feed_bags !== null && feed_bags !== undefined) {
        throw new HttpError(400, "Feed bags should not be provided for egg deliveries");
      }
    } else if (delivery_type === "Ingoing Feed") {
      if (isNaN(feed_bags) || feed_bags < 0 || !Number.isInteger(Number(feed_bags))) {
        throw new HttpError(400, "Feed bags must be a non-negative whole number");
      }
      if (egg_trays !== null && egg_trays !== undefined) {
        throw new HttpError(400, "Egg trays should not be provided for feed deliveries");
      }
    }

    const result = await pool.query(
      `INSERT INTO deliveries (submitted_by, worker_name, client, egg_trays, feed_bags, delivery_type, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, submitted_by, worker_name, client, egg_trays, feed_bags, delivery_type, created_at, user_id`,
      [
        submittedBy, 
        worker_name, 
        client, 
        delivery_type === "Outgoing Eggs" ? Number(egg_trays) : null,
        delivery_type === "Ingoing Feed" ? Number(feed_bags) : null,
        delivery_type,
        userId
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/deliveries/:id - Update delivery (accessible to workers and managers)
deliveriesRouter.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      client,
      egg_trays,
      feed_bags,
      delivery_type,
      worker_name
    } = req.body;

    const userId = req.auth?.id;
    const userRole = req.auth?.role;

    if (!client || client.trim() === "") {
      throw new HttpError(400, "Client name is required");
    }
    if (!delivery_type || !["Outgoing Eggs", "Ingoing Feed"].includes(delivery_type)) {
      throw new HttpError(400, "Delivery type must be 'Outgoing Eggs' or 'Ingoing Feed'");
    }

    // Validate based on delivery type
    if (delivery_type === "Outgoing Eggs") {
      if (isNaN(egg_trays) || egg_trays < 0 || !Number.isInteger(Number(egg_trays))) {
        throw new HttpError(400, "Egg trays must be a non-negative whole number");
      }
      if (feed_bags !== null && feed_bags !== undefined) {
        throw new HttpError(400, "Feed bags should not be provided for egg deliveries");
      }
    } else if (delivery_type === "Ingoing Feed") {
      if (isNaN(feed_bags) || feed_bags < 0 || !Number.isInteger(Number(feed_bags))) {
        throw new HttpError(400, "Feed bags must be a non-negative whole number");
      }
      if (egg_trays !== null && egg_trays !== undefined) {
        throw new HttpError(400, "Egg trays should not be provided for feed deliveries");
      }
    }

    let result;
    if (userRole === "manager") {
      // Managers can update any delivery
      result = await pool.query(
        `UPDATE deliveries 
         SET client = $1, egg_trays = $2, feed_bags = $3, delivery_type = $4, worker_name = $5
         WHERE id = $6
         RETURNING id, submitted_by, worker_name, client, egg_trays, feed_bags, delivery_type, created_at, user_id`,
        [
          client,
          delivery_type === "Outgoing Eggs" ? Number(egg_trays) : null,
          delivery_type === "Ingoing Feed" ? Number(feed_bags) : null,
          delivery_type,
          worker_name,
          id
        ]
      );
    } else {
      // Workers can only update their own deliveries
      result = await pool.query(
        `UPDATE deliveries 
         SET client = $1, egg_trays = $2, feed_bags = $3, delivery_type = $4, worker_name = $5
         WHERE id = $6 AND user_id = $7
         RETURNING id, submitted_by, worker_name, client, egg_trays, feed_bags, delivery_type, created_at, user_id`,
        [
          client,
          delivery_type === "Outgoing Eggs" ? Number(egg_trays) : null,
          delivery_type === "Ingoing Feed" ? Number(feed_bags) : null,
          delivery_type,
          worker_name,
          id,
          userId
        ]
      );
    }

    if (result.rows.length === 0) {
      throw new HttpError(404, "Delivery not found or access denied");
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/deliveries/:id - Delete delivery (accessible to managers only)
deliveriesRouter.delete("/:id", requireAuth, requireRole("manager"), async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM deliveries 
       WHERE id = $1
       RETURNING id, submitted_by, worker_name, client, egg_trays, feed_bags, delivery_type, created_at, user_id`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new HttpError(404, "Delivery not found");
    }

    res.json({ message: "Delivery deleted successfully", delivery: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = { deliveriesRouter };
