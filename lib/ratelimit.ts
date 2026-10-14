import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const adLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 h"), // 3 annonces / heure / IP
  prefix: "rl:ad",
});

export const messageLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  prefix: "rl:msg",
});
