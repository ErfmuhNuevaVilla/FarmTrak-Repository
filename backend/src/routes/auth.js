const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { pool } = require("../db/pool");
const { env } = require("../config/env");
const { HttpError } = require("../utils/httpError");
const { requireAuth } = require("../middleware/requireAuth");

const authRouter = express.Router();

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

function isValidEmail(email) {
  // pragmatic email check (not fully RFC compliant)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeRole(value) {
  const role = String(value || "worker").trim().toLowerCase();
  if (!["admin", "manager", "worker"].includes(role)) return null;
  return role;
}

// POST /api/auth/register
// body: { name, email, password, role? }
authRouter.post("/register", async (req, res, next) => {
  try {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const role = normalizeRole(req.body?.role);

    if (!name) throw new HttpError(400, "Name is required");
    if (!email) throw new HttpError(400, "Email is required");
    if (!isValidEmail(email)) throw new HttpError(400, "Email is invalid");
    if (!password || password.length < 6)
      throw new HttpError(400, "Password must be at least 6 characters");
    if (!role) throw new HttpError(400, "Role must be admin, manager, or worker");

    const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

    let user;
    try {
      const result = await pool.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, role, created_at`,
        [name, email, passwordHash, role]
      );
      user = result.rows[0];
    } catch (e) {
      // unique_violation
      if (e && e.code === "23505") {
        throw new HttpError(409, "Email already registered");
      }
      throw e;
    }

    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
// body: { email, password }
authRouter.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!email) throw new HttpError(400, "Email is required");
    if (!isValidEmail(email)) throw new HttpError(400, "Email is invalid");
    if (!password) throw new HttpError(400, "Password is required");

    const result = await pool.query(
      `SELECT id, name, email, role, password_hash, disabled
       FROM users
       WHERE email = $1`,
      [email]
    );

    const row = result.rows[0];
    if (!row) throw new HttpError(401, "Invalid email or password");

    if (row.disabled) {
      throw new HttpError(403, "Your account has been disabled. Please contact an administrator.");
    }

    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) throw new HttpError(401, "Invalid email or password");

    const user = { id: row.id, name: row.name, email: row.email, role: row.role };
    const token = signToken(user);

    res.json({ token, user });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
// header: Authorization: Bearer <token>
authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const userId = Number(req.auth?.sub);
    if (!userId) throw new HttpError(401, "Invalid token");

    const result = await pool.query(
      `SELECT id, name, email, role, created_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    const user = result.rows[0];
    if (!user) throw new HttpError(401, "User not found");

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

module.exports = { authRouter };

