import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load env from current working directory
dotenv.config();

// Additionally, try loading env from the project root if not present when running in server/
if (!process.env.MONGODB_URI || !process.env.SESSION_SECRET) {
  const candidatePaths = [
    path.resolve(process.cwd(), "../.env"),
    path.resolve(__dirname, "../../.env"),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
      break;
    }
  }
}

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "production",
  PORT: Number(process.env.PORT || 3001),
  MONGODB_URI: process.env.MONGODB_URI || "mongodb+srv://AshtonZackey:Zackey101@cluster0.n7h5iw1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  SESSION_SECRET: process.env.SESSION_SECRET || "change_me_in_dotenv",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "https://localhost:8080",
  HTTPS_ONLY: (process.env.HTTPS_ONLY || "false").toLowerCase() === "true",
} as const;

if (!ENV.MONGODB_URI) {
  // eslint-disable-next-line no-console
  console.warn("[env] MONGODB_URI is not set. Set it in .env for the API to work.");
}
