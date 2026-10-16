// Settings for the NSNN marketing pipeline. Every secret comes from the environment
// (GitHub Actions secrets in production); nothing sensitive lives in the repo.
export const TIMEZONE = 'America/Chicago';
export const SITE_ORIGIN = 'https://northstardeliveryservice.com';

export function loadConfig(env = process.env) {
  const num = (v, d) => (v === undefined || v === '' || !Number.isFinite(Number(v)) ? d : Number(v));
  return {
    anthropicModel: env.NSNN_MODEL || 'claude-opus-5-5',
    anthropicEffort: env.NSNN_EFFORT || 'medium',
    eiaApiKey: env.EIA_API_KEY || '',
    beehiivApiKey: env.BEEHIIV_API_KEY || '',
    beehiivPublicationId: env.BEEHIIV_PUBLICATION_ID || '',
    // Local send time for scheduled Beehiiv posts (America/Chicago).
    sendTime: /^\d{2}:\d{2}$/.test(env.NSNN_SEND_TIME || '') ? env.NSNN_SEND_TIME : '06:30',
    maxHeadlinesPerFeed: num(env.NSNN_MAX_HEADLINES_PER_FEED, 20),
    // Feeds sometimes resurface years-old stories; anything older than this (or undated) is dropped.
    maxHeadlineAgeDays: num(env.NSNN_MAX_HEADLINE_AGE_DAYS, 7),
    recentEntriesOnIndex: num(env.NSNN_RECENT_ENTRIES, 10),
    thresholds: {
      // Week-over-week rise in the EIA U.S. diesel average that counts as a spike, in cents per gallon.
      fuelWeeklyCents: num(env.NSNN_FUEL_SPIKE_WEEKLY_CENTS, 5),
      // Rise over four weeks that counts as a spike even when each week moved less.
      fuelFourWeekCents: num(env.NSNN_FUEL_SPIKE_4WK_CENTS, 12),
      // Fraud-related headlines inside the lookback window needed to call it "trending".
      fraudHeadlines: num(env.NSNN_FRAUD_MIN_HEADLINES, 2),
      fraudLookbackHours: num(env.NSNN_FRAUD_LOOKBACK_HOURS, 72),
      fmcsaLookbackDays: num(env.NSNN_FMCSA_LOOKBACK_DAYS, 7),
      taxLookbackDays: num(env.NSNN_TAX_LOOKBACK_DAYS, 14),
    },
  };
}

// YYYY-MM-DD for an instant in a time zone.
export function localDate(at = new Date(), tz = TIMEZONE) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);
}

// Weekday name ("Friday") of a YYYY-MM-DD calendar date.
export function weekdayOf(date) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
}

// The UTC instant of a wall-clock time (HH:MM) on a date in a time zone, DST-safe.
export function zonedTimeToUtc(date, hhmm, tz = TIMEZONE) {
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = hhmm.split(':').map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const offsetAt = (ms) => {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        .formatToParts(new Date(ms)).map((p) => [p.type, p.value]),
    );
    return Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute) - ms;
  };
  let ms = guess - offsetAt(guess);
  ms = guess - offsetAt(ms); // second pass settles the hour around a DST change
  return new Date(ms);
}
