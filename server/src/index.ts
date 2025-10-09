import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import csurf from "csurf";
import { ENV } from "./config/env";
import { securityMiddleware, enforceHttps } from "./middleware/security";
import authRouter from "./routes/auth";

const app = express();

// Trust proxy for HTTPS detection behind reverse proxies
app.set("trust proxy", 1);

// Core middleware
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use(cookieParser());

// Security middleware
app.use(enforceHttps);
app.use(securityMiddleware);

// Sessions (mitigate session jacking: httpOnly, sameSite=strict, secure in prod)
const sessionStore = MongoStore.create({
  mongoUrl: ENV.MONGODB_URI,
  ttl: 60 * 60, // 1 hour
  crypto: {
    secret: ENV.SESSION_SECRET,
  },
});

app.use(
  session({
    name: "sid",
    secret: ENV.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      sameSite: "strict",
      secure: ENV.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  })
);

// CSRF protection using double-submit cookie pattern
const csrfProtection = csurf({ cookie: { httpOnly: true, sameSite: "strict", secure: ENV.NODE_ENV === "production" } });

// Expose CSRF token endpoint for the SPA to fetch and use
app.get("/api/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Protected API routes use csrfProtection
app.use("/api/auth", csrfProtection, authRouter);

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

async function start() {
  try {
    if (!ENV.MONGODB_URI) {
      console.error("MONGODB_URI is not configured. Set it in .env");
      process.exit(1);
    }
    await mongoose.connect(ENV.MONGODB_URI);
    console.log("Connected to MongoDB");

    app.listen(ENV.PORT, () => {
      console.log(`API listening on http://localhost:${ENV.PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
}

start();
