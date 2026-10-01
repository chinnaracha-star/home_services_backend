import { ipKeyGenerator, rateLimit } from "express-rate-limit";

export const chatbotPreAuthRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 60,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      message: "Too many chatbot requests. Please try again later.",
      code: "CHAT_RATE_LIMITED",
      errors: [],
    });
  },
});

export const chatbotRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: (req) => (req.user ? 30 : 10),
  keyGenerator: (req) =>
    req.user ? `user:${req.user.id}` : `ip:${ipKeyGenerator(req.ip)}`,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      message: "Too many chatbot requests. Please try again later.",
      code: "CHAT_RATE_LIMITED",
      errors: [],
    });
  },
});
