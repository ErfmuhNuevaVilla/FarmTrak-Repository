const express = require("express");
const cors = require("cors");

const { env } = require("./config/env");
const { authRouter } = require("./routes/auth");
const { usersRouter } = require("./routes/users");
const { buildingsRouter } = require("./routes/buildings");
const { reportsRouter } = require("./routes/reports");
const { dashboardRouter } = require("./routes/dashboard");
const { deliveriesRouter } = require("./routes/deliveries");

function createApp() {
  const app = express();

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // In development, allow localhost and local network IPs
        if (env.NODE_ENV === "development") {
          const allowedOrigins = [
            env.FRONTEND_ORIGIN,
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            /^http:\/\/192\.168\.\d+\.\d+:5173$/, // Allow any 192.168.x.x:5173
            /^http:\/\/10\.\d+\.\d+\.\d+:5173$/,  // Allow any 10.x.x.x:5173
          ];
          
          if (allowedOrigins.some(allowed => {
            if (allowed instanceof RegExp) {
              return allowed.test(origin);
            }
            return allowed === origin;
          })) {
            return callback(null, true);
          }
        } else {
          // In production, only allow the configured frontend origin
          if (origin === env.FRONTEND_ORIGIN) {
            return callback(null, true);
          }
        }
        
        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/buildings", buildingsRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/deliveries", deliveriesRouter);

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    // eslint-disable-next-line no-console
    console.error(err);
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.publicMessage || "Internal server error",
    });
  });

  return app;
}

module.exports = { createApp };

