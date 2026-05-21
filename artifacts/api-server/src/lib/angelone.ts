import { createHmac } from "crypto";

/* ── inline TOTP (RFC 6238) — no external dep needed ─────── */
function base32Decode(s: string): Buffer {
  const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = s.toUpperCase().replace(/=+$/, "");
  let bits = 0, val = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = alpha.indexOf(ch);
    if (idx < 0) continue;
    val = (val << 5) | idx;
    bits += 5;
    if (bits >= 8) { out.push((val >>> (bits - 8)) & 0xff); bits -= 8; }
  }
  return Buffer.from(out);
}

function generateTOTP(secret: string, period = 30, digits = 6): string {
  // Support both UUID/hex format (e.g. "cacc1130-1404-4fcf-b428-eb79e2af95ce")
  // and standard base32 format (e.g. "JBSWY3DPEHPK3PXP")
  const hexOnly = secret.replace(/-/g, "");
  const key =
    /^[0-9a-fA-F]{32}$/.test(hexOnly)
      ? Buffer.from(hexOnly, "hex")
      : base32Decode(secret);
  const counter = Math.floor(Date.now() / 1000 / period);
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const hmac = createHmac("sha1", key).update(buf).digest();
  const off = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[off] & 0x7f) << 24) | ((hmac[off + 1] & 0xff) << 16) |
    ((hmac[off + 2] & 0xff) << 8) | (hmac[off + 3] & 0xff);
  return (code % 10 ** digits).toString().padStart(digits, "0");
}

const BASE = "https://apiconnect.angelone.in";
const MASTER_URL =
  "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json";

export type AngelInterval =
  | "ONE_MINUTE"
  | "THREE_MINUTE"
  | "FIVE_MINUTE"
  | "TEN_MINUTE"
  | "FIFTEEN_MINUTE"
  | "THIRTY_MINUTE"
  | "ONE_HOUR"
  | "ONE_DAY";

interface AuthTokens {
  jwtToken: string;
  feedToken: string;
  expiresAt: number;
}

interface Instrument {
  token: string;
  symbol: string;
  name: string;
  exch_seg: string;
}

let cachedAuth: AuthTokens | null = null;
let nseMap: Map<string, string> | null = null; // NSE symbol → token

export function isConfigured(): boolean {
  return !!(
    process.env.ANGEL_API_KEY &&
    process.env.ANGEL_CLIENT_CODE &&
    process.env.ANGEL_MPIN &&
    process.env.ANGEL_TOTP_SECRET
  );
}

async function loadInstruments(): Promise<void> {
  if (nseMap) return;
  const res = await fetch(MASTER_URL, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const list = (await res.json()) as Instrument[];
  const map = new Map<string, string>();
  for (const inst of list) {
    if (inst.exch_seg === "NSE") {
      const sym = inst.symbol.replace(/-EQ$/i, "").toUpperCase();
      map.set(sym, inst.token);
    }
  }
  nseMap = map;
}

export async function getSymbolToken(symbol: string): Promise<string | null> {
  await loadInstruments();
  return nseMap!.get(symbol.toUpperCase()) ?? null;
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-UserType": "USER",
    "X-SourceID": "WEB",
    "X-ClientLocalIP": "127.0.0.1",
    "X-ClientPublicIP": "127.0.0.1",
    "X-MACAddress": "00:00:00:00:00:00",
    "X-PrivateKey": process.env.ANGEL_API_KEY!,
    ...extra,
  };
}

async function authenticate(): Promise<AuthTokens> {
  const totp = generateTOTP(process.env.ANGEL_TOTP_SECRET!);
  const res = await fetch(
    `${BASE}/rest/auth/angelbroking/user/v1/loginByPassword`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        clientcode: process.env.ANGEL_CLIENT_CODE,
        password: process.env.ANGEL_MPIN,
        totp,
      }),
    }
  );
  const data = (await res.json()) as {
    status: boolean;
    message: string;
    data?: { jwtToken: string; feedToken: string };
  };
  if (!data.status || !data.data?.jwtToken) {
    throw new Error(`Angel One auth failed: ${data.message}`);
  }
  return {
    jwtToken: data.data.jwtToken,
    feedToken: data.data.feedToken,
    expiresAt: Date.now() + 23 * 60 * 60 * 1000,
  };
}

async function getAuth(): Promise<AuthTokens> {
  if (cachedAuth && Date.now() < cachedAuth.expiresAt) return cachedAuth;
  cachedAuth = await authenticate();
  return cachedAuth;
}

export type CandleRow = [string, number, number, number, number, number];

export async function getCandleData(
  symbolToken: string,
  interval: AngelInterval,
  fromdate: string,
  todate: string,
  exchange = "NSE"
): Promise<CandleRow[]> {
  const auth = await getAuth();
  const res = await fetch(
    `${BASE}/rest/secure/angelbroking/historical/v1/getCandleData`,
    {
      method: "POST",
      headers: headers({
        Authorization: `Bearer ${auth.jwtToken}`,
        "X-ClientCode": process.env.ANGEL_CLIENT_CODE!,
        "X-FeedToken": auth.feedToken,
      }),
      body: JSON.stringify({ exchange, symboltoken: symbolToken, interval, fromdate, todate }),
    }
  );
  const data = (await res.json()) as {
    status: boolean;
    message: string;
    data?: CandleRow[];
  };
  if (!data.status) throw new Error(`Candle data error: ${data.message}`);
  return data.data ?? [];
}
