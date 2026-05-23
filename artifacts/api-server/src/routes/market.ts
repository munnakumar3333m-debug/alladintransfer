import { Router } from "express";
import { getLtpBatch } from "../lib/angelone";

const router = Router();

router.get("/market/ltp", async (req, res) => {
  const raw = (req.query.symbols as string | undefined)?.trim();
  if (!raw) {
    res.status(400).json({ error: "symbols query param is required" });
    return;
  }

  const symbols = raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 20);

  try {
    const results = await getLtpBatch(symbols);
    const prices: Record<string, number> = {};
    for (const r of results) prices[r.symbol] = r.ltp;

    const source = results[0]?.source ?? "none";
    res.json({ prices, source });
  } catch (err) {
    req.log.error(err, "market/ltp failed");
    res.status(500).json({ error: err instanceof Error ? err.message : "LTP fetch failed" });
  }
});

export default router;
