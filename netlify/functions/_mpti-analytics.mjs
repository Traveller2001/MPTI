import { getStore } from "@netlify/blobs";

export const STORE_NAME = "mpti-analytics-v1";
export const SUMMARY_KEY = "summary/summary-v1.json";
const SUMMARY_SCHEMA_VERSION = 2;
const MAX_SUMMARY_UPDATE_RETRIES = 8;

export const PERSONA_CODES = [
  "GOAT",
  "CTRL",
  "PUSH",
  "CAKE",
  "ATM",
  "ZOOM",
  "AFK",
  "GPS",
  "TANK",
  "BOOM",
  "5G",
  "YOLO",
  "007",
  "CPU",
  "ZEN",
  "REJ",
  "PUA",
  "996",
  "GRAB",
  "WIFI",
  "NULL"
];

export function createAnalyticsStore() {
  return getStore({ name: STORE_NAME, consistency: "strong" });
}

export function json(data, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), {
    ...init,
    headers
  });
}

export function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function createEmptyCounts() {
  return Object.fromEntries(PERSONA_CODES.map((code) => [code, 0]));
}

function normalizeNonNegativeInteger(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return 0;
  return Math.floor(number);
}

function normalizeIsoTimestamp(value) {
  if (typeof value !== "string" || !value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function createEmptyFeedbackCounts() {
  return Object.fromEntries(PERSONA_CODES.map((code) => [code, { accurate: 0, inaccurate: 0 }]));
}

export function createEmptySummary() {
  return {
    schemaVersion: SUMMARY_SCHEMA_VERSION,
    totalVisits: 0,
    totalResults: 0,
    lastUpdatedAt: null,
    counts: createEmptyCounts(),
    feedback: {
      total: 0,
      accurate: 0,
      inaccurate: 0,
      byPersona: createEmptyFeedbackCounts()
    }
  };
}

export function cloneSummary(summary) {
  const normalized = normalizeSummary(summary);
  const byPersona = {};
  for (const code of PERSONA_CODES) {
    byPersona[code] = { ...normalized.feedback.byPersona[code] };
  }
  return {
    ...normalized,
    counts: { ...normalized.counts },
    feedback: { ...normalized.feedback, byPersona }
  };
}

export function normalizeSummary(summary) {
  const next = createEmptySummary();
  if (!summary || typeof summary !== "object") return next;
  if (normalizeNonNegativeInteger(summary.schemaVersion) !== SUMMARY_SCHEMA_VERSION) return next;

  next.totalVisits = normalizeNonNegativeInteger(summary.totalVisits);
  next.totalResults = normalizeNonNegativeInteger(summary.totalResults);
  next.lastUpdatedAt = normalizeIsoTimestamp(summary.lastUpdatedAt);

  if (summary.counts && typeof summary.counts === "object") {
    for (const code of PERSONA_CODES) {
      next.counts[code] = normalizeNonNegativeInteger(summary.counts[code]);
    }
  }

  if (summary.feedback && typeof summary.feedback === "object") {
    next.feedback.total = normalizeNonNegativeInteger(summary.feedback.total);
    next.feedback.accurate = normalizeNonNegativeInteger(summary.feedback.accurate);
    next.feedback.inaccurate = normalizeNonNegativeInteger(summary.feedback.inaccurate);
    if (summary.feedback.byPersona && typeof summary.feedback.byPersona === "object") {
      for (const code of PERSONA_CODES) {
        const entry = summary.feedback.byPersona[code];
        if (entry && typeof entry === "object") {
          next.feedback.byPersona[code].accurate = normalizeNonNegativeInteger(entry.accurate);
          next.feedback.byPersona[code].inaccurate = normalizeNonNegativeInteger(entry.inaccurate);
        }
      }
    }
  }

  return next;
}

function getLatestIsoTimestamp(currentIso, candidateIso) {
  const current = normalizeIsoTimestamp(currentIso);
  const candidate = normalizeIsoTimestamp(candidateIso);
  if (!current) return candidate;
  if (!candidate) return current;
  return Date.parse(candidate) > Date.parse(current) ? candidate : current;
}

export function addVisitToSummary(summary, recordedAt) {
  const next = cloneSummary(summary);
  next.totalVisits += 1;
  next.lastUpdatedAt = getLatestIsoTimestamp(next.lastUpdatedAt, recordedAt);
  return next;
}

export function addResultToSummary(summary, personaCode, recordedAt) {
  if (!PERSONA_CODES.includes(personaCode)) {
    throw new Error(`Unknown personaCode: ${personaCode}`);
  }

  const next = cloneSummary(summary);
  next.totalResults += 1;
  next.counts[personaCode] += 1;
  next.lastUpdatedAt = getLatestIsoTimestamp(next.lastUpdatedAt, recordedAt);
  return next;
}

export function addFeedbackToSummary(summary, personaCode, verdict, previousVerdict) {
  if (!PERSONA_CODES.includes(personaCode)) {
    throw new Error(`Unknown personaCode: ${personaCode}`);
  }

  const next = cloneSummary(summary);

  if (previousVerdict === "accurate" || previousVerdict === "inaccurate") {
    next.feedback.total -= 1;
    next.feedback[previousVerdict] -= 1;
    next.feedback.byPersona[personaCode][previousVerdict] -= 1;
  }

  next.feedback.total += 1;
  next.feedback[verdict] += 1;
  next.feedback.byPersona[personaCode][verdict] += 1;
  return next;
}

function extractTimestamp(key) {
  const match = key.match(/\/(\d{13})-/);
  return match ? Number(match[1]) : 0;
}

function extractPersonaCode(key) {
  const match = key.match(/^results\/([^/]+)\//);
  return match ? decodeURIComponent(match[1]) : null;
}

export function buildPublicSummary(summary) {
  const normalized = normalizeSummary(summary);
  const ranking = PERSONA_CODES.map((code) => {
    const count = normalized.counts[code];
    const fb = normalized.feedback.byPersona[code];
    return {
      code,
      count,
      share: normalized.totalResults ? Number(((count / normalized.totalResults) * 100).toFixed(1)) : 0,
      feedbackAccurate: fb.accurate,
      feedbackInaccurate: fb.inaccurate
    };
  }).sort((left, right) => {
    if (right.count !== left.count) return right.count - left.count;
    return left.code.localeCompare(right.code, "en");
  });

  return {
    totalVisits: normalized.totalVisits,
    totalResults: normalized.totalResults,
    uniquePersonasHit: ranking.filter((item) => item.count > 0).length,
    lastUpdatedAt: normalized.lastUpdatedAt,
    ranking,
    feedback: {
      total: normalized.feedback.total,
      accurate: normalized.feedback.accurate,
      inaccurate: normalized.feedback.inaccurate
    }
  };
}

export async function loadSummarySnapshot(store) {
  const entry = await store.getWithMetadata(SUMMARY_KEY, {
    type: "json",
    consistency: "strong"
  });

  if (entry === null) return null;
  if (normalizeNonNegativeInteger(entry.data?.schemaVersion) !== SUMMARY_SCHEMA_VERSION) return null;

  return {
    summary: normalizeSummary(entry.data),
    etag: entry.etag
  };
}

export async function listAllKeys(store, prefix) {
  const keys = [];
  for await (const page of store.list({ prefix, paginate: true })) {
    for (const blob of page.blobs) {
      keys.push(blob.key);
    }
  }
  return keys;
}

export async function rebuildSummaryFromEvents(store) {
  const summary = createEmptySummary();

  const visitKeys = await listAllKeys(store, "visits/");
  for (const key of visitKeys) {
    summary.totalVisits += 1;
    const timestamp = extractTimestamp(key);
    if (timestamp) {
      summary.lastUpdatedAt = getLatestIsoTimestamp(summary.lastUpdatedAt, new Date(timestamp).toISOString());
    }
  }

  const resultKeys = await listAllKeys(store, "results/");
  for (const key of resultKeys) {
    const code = extractPersonaCode(key);
    if (!(code && code in summary.counts)) continue;

    summary.totalResults += 1;
    summary.counts[code] += 1;

    const timestamp = extractTimestamp(key);
    if (timestamp) {
      summary.lastUpdatedAt = getLatestIsoTimestamp(summary.lastUpdatedAt, new Date(timestamp).toISOString());
    }

    try {
      const entry = await store.get(key, { type: "json" });
      if (entry && entry.feedback && typeof entry.feedback === "object") {
        const verdict = entry.feedback.verdict;
        if (verdict === "accurate" || verdict === "inaccurate") {
          summary.feedback.total += 1;
          summary.feedback[verdict] += 1;
          summary.feedback.byPersona[code][verdict] += 1;
        }
      }
    } catch (_) {
      // skip unreadable entries during rebuild
    }
  }

  return summary;
}

export async function ensureSummarySnapshot(store) {
  const existing = await loadSummarySnapshot(store);
  if (existing) return existing;

  const rebuilt = await rebuildSummaryFromEvents(store);
  const updated = await store.setJSON(SUMMARY_KEY, rebuilt);
  return {
    summary: rebuilt,
    etag: updated.etag
  };
}

export async function updateSummarySnapshot(store, mutator) {
  let current = await ensureSummarySnapshot(store);

  for (let attempt = 0; attempt < MAX_SUMMARY_UPDATE_RETRIES; attempt += 1) {
    const next = normalizeSummary(mutator(cloneSummary(current.summary)));
    const updated = await store.setJSON(SUMMARY_KEY, next, {
      onlyIfMatch: current.etag
    });

    if (updated.modified) {
      return next;
    }

    const fresh = await loadSummarySnapshot(store);
    if (!fresh) {
      current = await ensureSummarySnapshot(store);
      continue;
    }

    current = fresh;
  }

  throw new Error("Failed to update analytics summary after concurrent retries");
}
