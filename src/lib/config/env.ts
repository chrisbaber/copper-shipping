/**
 * Environment configuration — mirrors ACL pattern.
 * All env vars accessed through this module, never directly.
 */

function requireEnv(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, defaultValue?: string): string | undefined {
  return process.env[key]?.trim() ?? defaultValue;
}

/** AI configuration — Gemini Flash via OpenRouter */
export const aiConfig = {
  get openRouterApiKey() {
    return requireEnv("OPENROUTER_API_KEY");
  },
};

/**
 * Canonical site URL used for auth redirects (magic links, OAuth callbacks).
 * Falls back through: NEXT_PUBLIC_SITE_URL → NEXT_PUBLIC_VERCEL_URL → localhost.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

/** Supabase configuration */
export const supabaseConfig = {
  get url() {
    return requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  },
  get anonKey() {
    return requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
  get serviceKey() {
    return requireEnv("SUPABASE_SERVICE_KEY");
  },
};

/** SMTP email configuration */
export const emailConfig = {
  get host() {
    return optionalEnv("SMTP_HOST");
  },
  get port() {
    return Number(optionalEnv("SMTP_PORT", "587"));
  },
  get user() {
    return optionalEnv("SMTP_USER");
  },
  get pass() {
    return optionalEnv("SMTP_PASS");
  },
};

/** SMS configuration */
export const smsConfig = {
  get twilioAccountSid() {
    return optionalEnv("TWILIO_ACCOUNT_SID");
  },
  get twilioAuthToken() {
    return optionalEnv("TWILIO_AUTH_TOKEN");
  },
  get twilioPhoneNumber() {
    return optionalEnv("TWILIO_PHONE_NUMBER");
  },
};
