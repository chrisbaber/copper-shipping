/** Default broker settings — used as fallback when DB settings are unavailable */
export const DEFAULT_BROKER = {
  companyName: "Kingdom Family Brokerage, Inc.",
  address: "7533 Kingsmill Terrace",
  city: "Fort Worth",
  state: "TX",
  zip: "76112",
  phone: "(682) 231-3575",
  email: "Hlrolfe@dfwtrucking.com",
  ein: "29-58805",
  mcNumber: "1750411",
  usDot: "4444213",
};

export const DEFAULT_PAYMENT = {
  bankName: "Bank of America",
  bankAccount: "488135011117",
  bankRouting: "111 000 025",
};

export const DEFAULT_CONTACT = {
  submittedBy: "Henry L Wolfe",
  contactPhone: "(682) 231-3575",
  contactEmail: "Hlrolfe@dfwtrucking.com",
};

/** Full broker settings object (broker + payment + contact) */
export type BrokerSettings = typeof DEFAULT_BROKER &
  typeof DEFAULT_PAYMENT &
  typeof DEFAULT_CONTACT & { logoUrl?: string };

/** Merge all defaults into a single settings object */
export function getDefaultSettings(): BrokerSettings {
  return {
    ...DEFAULT_BROKER,
    ...DEFAULT_PAYMENT,
    ...DEFAULT_CONTACT,
  };
}
