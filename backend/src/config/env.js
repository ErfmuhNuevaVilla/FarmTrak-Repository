function required(name, value) {
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function optionalNumber(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 4000),

  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || "http://localhost:5173",

  // Prefer DATABASE_URL if present; otherwise build from DB_* pieces
  DATABASE_URL:
    process.env.DATABASE_URL ||
    (() => {
      const user = required("DB_USER", process.env.DB_USER);
      const host = required("DB_HOST", process.env.DB_HOST);
      const name = required("DB_NAME", process.env.DB_NAME);
      const pass = required("DB_PASS", process.env.DB_PASS);
      const port = optionalNumber(process.env.DB_PORT, 5432);
      return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(
        pass
      )}@${host}:${port}/${name}`;
    })(),

  JWT_SECRET: required("JWT_SECRET", process.env.JWT_SECRET),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS || 12),
};

module.exports = { env };

