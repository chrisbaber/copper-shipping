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

/** AI configuration — supports both direct Anthropic and OpenRouter */
export const aiConfig = {
  /** OpenRouter API key (preferred for now) */
  get openRouterApiKey() {
    return optionalEnv("OPENROUTER_API_KEY");
  },
  /** Direct Anthropic API key (future) */
  get anthropicApiKey() {
    return optionalEnv("ANTHROPIC_API_KEY");
  },
  /** Model identifier — OpenRouter format, e.g. "google/gemini-2.0-flash-exp:free" */
  get model() {
    return optionalEnv("ANTHROPIC_MODEL", "google/gemini-2.0-flash-exp:free") as string;
  },
  /** Which provider to use */
  get provider(): "openrouter" | "anthropic" {
    if (optionalEnv("OPENROUTER_API_KEY")) return "openrouter";
    if (optionalEnv("ANTHROPIC_API_KEY")) return "anthropic";
    throw new Error("Either OPENROUTER_API_KEY or ANTHROPIC_API_KEY must be set");
  },
};

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
