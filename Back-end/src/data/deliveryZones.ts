// Static delivery-zone tables, keyed off the structure of Indian PIN codes:
// the first 2 digits identify the postal circle (≈ state), the first 3 the
// sorting district. That hierarchy is what makes a table this small workable —
// there is no courier integration behind any of this.
//
// State names must match Front-end/src/data/india.ts exactly, so an area
// reported here lines up with the checkout state picker.

/** 2-digit prefix → state / union territory. Absent means "not serviced". */
export const STATE_BY_PREFIX: Record<string, string> = {
  11: 'Delhi',
  12: 'Haryana',
  13: 'Haryana',
  14: 'Punjab',
  15: 'Punjab',
  16: 'Chandigarh',
  17: 'Himachal Pradesh',
  18: 'Jammu and Kashmir',
  19: 'Jammu and Kashmir',
  20: 'Uttar Pradesh',
  21: 'Uttar Pradesh',
  22: 'Uttar Pradesh',
  23: 'Uttar Pradesh',
  24: 'Uttar Pradesh',
  25: 'Uttar Pradesh',
  26: 'Uttar Pradesh',
  27: 'Uttar Pradesh',
  28: 'Uttar Pradesh',
  30: 'Rajasthan',
  31: 'Rajasthan',
  32: 'Rajasthan',
  33: 'Rajasthan',
  34: 'Rajasthan',
  36: 'Gujarat',
  37: 'Gujarat',
  38: 'Gujarat',
  39: 'Gujarat',
  40: 'Maharashtra',
  41: 'Maharashtra',
  42: 'Maharashtra',
  43: 'Maharashtra',
  44: 'Maharashtra',
  45: 'Madhya Pradesh',
  46: 'Madhya Pradesh',
  47: 'Madhya Pradesh',
  48: 'Madhya Pradesh',
  49: 'Chhattisgarh',
  50: 'Telangana',
  51: 'Andhra Pradesh',
  52: 'Andhra Pradesh',
  53: 'Andhra Pradesh',
  56: 'Karnataka',
  57: 'Karnataka',
  58: 'Karnataka',
  59: 'Karnataka',
  60: 'Tamil Nadu',
  61: 'Tamil Nadu',
  62: 'Tamil Nadu',
  63: 'Tamil Nadu',
  64: 'Tamil Nadu',
  67: 'Kerala',
  68: 'Kerala',
  69: 'Kerala',
  70: 'West Bengal',
  71: 'West Bengal',
  72: 'West Bengal',
  73: 'West Bengal',
  74: 'West Bengal',
  75: 'Odisha',
  76: 'Odisha',
  77: 'Odisha',
  78: 'Assam',
  // 79 is not Assam — it is the North-East states, every one of which is
  // covered by REMOTE_STATE_BY_PREFIX below. Left out so nothing falls through
  // to a wrong state.
  80: 'Bihar',
  81: 'Bihar',
  82: 'Bihar',
  83: 'Jharkhand',
  84: 'Bihar',
  85: 'Bihar',
  // 90-99 are Army Post Offices — deliberately absent, so they fall through to
  // "not serviceable", which is the right answer for a consumer courier.
}

/**
 * 3-digit prefix → city, for the metros where the sorting district maps to one
 * city unambiguously. Everything else reports the state only — a city guessed
 * from a prefix would be wrong more often than not.
 */
export const METRO_BY_PREFIX: Record<string, string> = {
  110: 'Delhi',
  201: 'Noida',
  226: 'Lucknow',
  302: 'Jaipur',
  380: 'Ahmedabad',
  400: 'Mumbai',
  411: 'Pune',
  500: 'Hyderabad',
  560: 'Bengaluru',
  600: 'Chennai',
  700: 'Kolkata',
}

/**
 * Prefix → state for areas that take longer and don't support cash on delivery:
 * island territories, Ladakh / upper Kashmir, Sikkim and the North-East hills.
 * Matched with startsWith (longest key wins) and checked before the metro and
 * state tables.
 *
 * These carry their own state because the 2-digit circle is misleading here —
 * 744 sits inside West Bengal's circle but is Andaman, 737 is Sikkim, and 793
 * is Meghalaya rather than Assam. Falling back to STATE_BY_PREFIX would report
 * the wrong state on every one of them.
 *
 * Key lengths vary on purpose: Lakshadweep shares the 682 sorting district with
 * Kochi, so it needs 4 digits — a flat '682' would mark a metro of two million
 * people as remote and strip its COD.
 */
export const REMOTE_STATE_BY_PREFIX: Record<string, string> = {
  190: 'Jammu and Kashmir', // Srinagar valley
  191: 'Jammu and Kashmir',
  192: 'Jammu and Kashmir',
  193: 'Jammu and Kashmir',
  194: 'Ladakh', // Leh
  6825: 'Lakshadweep', // 682001 and neighbours are Kochi, not the islands
  737: 'Sikkim',
  744: 'Andaman and Nicobar Islands',
  790: 'Arunachal Pradesh',
  791: 'Arunachal Pradesh',
  792: 'Arunachal Pradesh',
  793: 'Meghalaya',
  794: 'Meghalaya',
  795: 'Manipur',
  796: 'Mizoram',
  797: 'Nagaland',
  798: 'Nagaland',
  799: 'Tripura',
}
