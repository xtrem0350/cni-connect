const countryDialCodes: Record<string, string> = {
  "+225": "CI",
  "+33": "FR",
  "+221": "SN",
  "+223": "ML",
  "+226": "BF",
  "+233": "GH",
  "+234": "NG",
  "+237": "CM",
  "+229": "BJ",
  "+228": "TG",
  "+1": "US",
  "+44": "GB",
  "+32": "BE",
  "+41": "CH",
  "+213": "DZ",
  "+212": "MA",
  "+216": "TN",
};

export const formatPhoneForSupabase = (phone: string): string => {
  let cleaned = phone.trim().replace(/[^\d+]/g, "");
  if (!cleaned) return "";

  if (cleaned.startsWith("0")) {
    cleaned = `+225${cleaned.slice(1)}`;
  } else if (cleaned.startsWith("225") && !cleaned.startsWith("+")) {
    cleaned = `+${cleaned}`;
  } else if (!cleaned.startsWith("+")) {
    cleaned = `+225${cleaned}`;
  }

  return cleaned.startsWith("+")
    ? `+${cleaned.slice(1).replace(/\D/g, "")}`
    : cleaned.replace(/\D/g, "");
};

export const isValidPhone = (phone: string): boolean =>
  /^\+225[0-9]{8,10}$/.test(formatPhoneForSupabase(phone));

export const extractPhoneParts = (phone: string): { dialCode: string; number: string } => {
  const formatted = formatPhoneForSupabase(phone);
  const dialCode = Object.keys(countryDialCodes)
    .sort((left, right) => right.length - left.length)
    .find((code) => formatted.startsWith(code));

  return dialCode
    ? { dialCode, number: formatted.slice(dialCode.length) }
    : { dialCode: "", number: formatted.replace(/^\+/, "") };
};

export const getCountryByDialCode = (dialCode: string): string | null =>
  countryDialCodes[dialCode] ?? null;
