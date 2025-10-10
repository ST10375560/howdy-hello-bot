import { Router } from "express";
import bcrypt from "bcrypt";
import { User } from "../models/User";
import { loginSchema, registerSchema, employeeLoginSchema } from "../utils/validators";
import rateLimit from "express-rate-limit";
import { bruteForceProtection } from "../middleware/security";

const router = Router();

// Extra rate limit on auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", authLimiter, async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    }

    const { username, password, fullName, idNumber, accountNumber } = parsed.data;
    const email = `${username}@securbank.internal`;

    const existing = await User.findOne({ $or: [{ username }, { email }, { accountNumber }] }).lean();
    if (existing) {
      return res.status(409).json({ error: "User already exists" });
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await User.create({
      username,
      email,
      fullName,
      idNumber,
      accountNumber,
      passwordHash,
    });

    // Rotate session
    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ error: "Session error" });
      (req.session as any).uid = user._id.toString();
      res.status(201).json({ message: "Registered", user: { username, fullName, accountNumber } });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", authLimiter, bruteForceProtection.prevent, async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    }
    const { username, password, accountNumber } = parsed.data;

    const user = await User.findOne({ username, accountNumber });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ error: "Session error" });
      (req.session as any).uid = user._id.toString();
      res.json({ message: "Logged in", user: { username: user.username, fullName: user.fullName, accountNumber: user.accountNumber } });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/logout", authLimiter, (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Failed to logout" });
    res.clearCookie("sid");
    res.json({ message: "Logged out" });
  });
});

router.post("/employee/login", authLimiter, bruteForceProtection.prevent, async (req, res) => {
  try {
    const parsed = employeeLoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    }
    const { employeeNumber, password } = parsed.data;

    // For employee login, we'll use a simple approach where employeeNumber is the username
    // In production, you'd have a separate Employee model with proper authentication
    const user = await User.findOne({ 
      $or: [
        { username: employeeNumber },
        { idNumber: employeeNumber }
      ]
    });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ error: "Session error" });
      (req.session as any).uid = user._id.toString();
      (req.session as any).role = "employee";
      res.json({ 
        message: "Employee logged in", 
        user: { 
          username: user.username, 
          fullName: user.fullName, 
          accountNumber: user.accountNumber,
          role: "employee"
        } 
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/me", authLimiter, async (req, res) => {
  const uid = (req.session as any).uid as string | undefined;
  if (!uid) return res.status(401).json({ error: "Unauthorized" });
  const user = await User.findById(uid).select("username fullName accountNumber").lean();
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const role = (req.session as any).role || "customer";
  res.json({ user: { ...user, role } });
});

export default router;
