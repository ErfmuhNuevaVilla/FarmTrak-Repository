const jwt = require("jsonwebtoken");

const { env } = require("../config/env");
const { HttpError } = require("../utils/httpError");

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

function requireAuth(req, _res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) throw new HttpError(401, "Missing bearer token");

    const payload = jwt.verify(token, env.JWT_SECRET);
    req.auth = payload;
    next();
  } catch (err) {
    if (err && err.name === "TokenExpiredError") {
      next(new HttpError(401, "Token expired"));
      return;
    }
    if (err && err.name === "JsonWebTokenError") {
      next(new HttpError(401, "Invalid token"));
      return;
    }
    next(err);
  }
}

module.exports = { requireAuth };

function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, _res, next) => {
    const role = req.auth?.role;
    if (!role || !allowed.includes(role)) {
      next(new HttpError(403, "Forbidden"));
      return;
    }
    next();
  };
}

module.exports.requireRole = requireRole;

