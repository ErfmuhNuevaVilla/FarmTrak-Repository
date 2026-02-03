const express = require("express");
const bcrypt = require("bcrypt");

const { pool } = require("../db/pool");
const { requireAuth, requireRole } = require("../middleware/requireAuth");
const { HttpError } = require("../utils/httpError");
const { env } = require("../config/env");

const usersRouter = express.Router();

// GET /api/users
usersRouter.get("/", requireAuth, requireRole("admin"), async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, disabled, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.json({ users: result.rows });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:id/disable - Toggle user disabled status
usersRouter.put("/:id/disable", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const disabled = Boolean(req.body?.disabled);

    if (!userId || isNaN(userId)) {
      throw new HttpError(400, "Invalid user ID");
    }

    // Prevent admin from disabling themselves
    if (userId === req.auth?.sub) {
      throw new HttpError(400, "You cannot disable your own account");
    }

    const result = await pool.query(
      `UPDATE users
       SET disabled = $1
       WHERE id = $2
       RETURNING id, name, email, role, disabled, created_at`,
      [disabled, userId]
    );

    if (result.rows.length === 0) {
      throw new HttpError(404, "User not found");
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/me - Update current user's profile (name and/or password)
usersRouter.put("/me", requireAuth, async (req, res, next) => {
  try {
    const userId = Number(req.auth?.sub);
    if (!userId) throw new HttpError(401, "Invalid token");

    const name = req.body?.name !== undefined ? String(req.body.name).trim() : undefined;
    const password =
      req.body?.password !== undefined ? String(req.body.password) : undefined;

    if ((name === undefined || name === "") && (password === undefined || password === "")) {
      throw new HttpError(400, "Nothing to update");
    }

    const existingRes = await pool.query(
      `SELECT id, name, email, role, disabled
       FROM users
       WHERE id = $1`,
      [userId]
    );

    const existing = existingRes.rows[0];
    if (!existing) throw new HttpError(404, "User not found");
    if (existing.disabled) {
      throw new HttpError(403, "Your account has been disabled. Please contact an administrator.");
    }

    let passwordHash;
    if (password !== undefined && password !== "") {
      if (password.length < 6) {
        throw new HttpError(400, "Password must be at least 6 characters");
      }
      passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
    }

    const newName = name !== undefined && name !== "" ? name : existing.name;

    const result = await pool.query(
      `UPDATE users
       SET name = $1,
           password_hash = COALESCE($2, password_hash)
       WHERE id = $3
       RETURNING id, name, email, role, created_at`,
      [newName, passwordHash || null, userId]
    );

    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = { usersRouter };

