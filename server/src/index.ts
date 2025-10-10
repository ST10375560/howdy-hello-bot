import express from "express";
import session from "express-session";
// import MongoStore from "connect-mongo"; // Disabled for testing
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import csurf from "csurf";
import https from "https";
import fs from "fs";
import path from "path";
import { ENV } from "./config/env";
import { securityMiddleware, enforceHttps } from "./middleware/security";
// import { generateSelfSignedCert, createHttpsServer } from "./utils/ssl";
import authRouter from "./routes/auth";
import transactionRouter from "./routes/transactions";

const app = express();

// Trust proxy for HTTPS detection behind reverse proxies
app.set("trust proxy", 1);

// Optional HTTP → HTTPS redirect in production
if (ENV.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (!req.secure) {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// Core middleware
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use(cookieParser());

// Security middleware
app.use(enforceHttps);
app.use(securityMiddleware);

// Sessions (using memory store for testing without MongoDB)
app.use(
  session({
    name: "sid",
    secret: ENV.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    // store: sessionStore, // Disabled for testing
    cookie: {
      httpOnly: true,
      sameSite: "strict",
      secure: ENV.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  })
);

// CSRF protection using double-submit cookie pattern
const csrfProtection = csurf({
  cookie: { httpOnly: true, sameSite: "strict", secure: ENV.NODE_ENV === "production" },
});

// Expose CSRF token endpoint for the SPA to fetch and use
app.get("/api/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Protected API routes
app.use("/api/auth", csrfProtection, authRouter);
app.use("/api/transactions", csrfProtection, transactionRouter);

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

async function start() {
  try {
    const port = ENV.PORT + 10 || 3011;

    // Connect to MongoDB if URI is provided
    if (ENV.MONGODB_URI && ENV.MONGODB_URI.startsWith("mongodb")) {
      console.log("🔌 Connecting to MongoDB Atlas...");
      await mongoose.connect(ENV.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
      console.log("✅ Connected to MongoDB Atlas");
    } else {
      console.warn("⚠️ Skipping MongoDB connection (MONGODB_URI missing or invalid)");
    }

    // Use HTTPS in production
    if (ENV.NODE_ENV === "production") {
      const sslOptions = {
        key: fs.readFileSync(path.resolve(__dirname, "../certs/key.pem")),
        cert: fs.readFileSync(path.resolve(__dirname, "../certs/cert.pem")),
      };

      https.createServer(sslOptions, app).listen(port, () => {
        console.log(`🔒 HTTPS API listening on https://localhost:${port}`);
      });
    } else {
      // Development / testing without SSL
      app.listen(port, () => {
        console.log(`📡 API listening on http://localhost:${port}`);
        console.log(`🔧 Running without SSL for now`);
      });
    }
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

start();
