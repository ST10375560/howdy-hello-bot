import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import { ENV } from "../config/env";
import { type RequestHandler } from "express";

export const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "blob:"],
        "connect-src": ["'self'", ENV.CORS_ORIGIN],
        "frame-ancestors": ["'none'"],
      },
    },
    frameguard: { action: "deny" },
    referrerPolicy: { policy: "no-referrer" },
    xssFilter: true,
    hsts: {
      maxAge: 15552000, // 180 days
      includeSubDomains: true,
      preload: true,
    },
  }),
  cors({
    origin: ENV.CORS_ORIGIN,
    credentials: true,
  }),
  compression(),
  mongoSanitize(),
  rateLimit({
    windowMs: 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests, please try again later.",
  }) as unknown as RequestHandler,
];

export const enforceHttps: RequestHandler = (req, res, next) => {
  if (!ENV.HTTPS_ONLY) return next();
  // trust proxy should be enabled in app when behind reverse proxy
  if (req.secure) return next();
  const host = req.headers.host;
  return res.redirect(301, `https://${host}${req.originalUrl}`);
};
