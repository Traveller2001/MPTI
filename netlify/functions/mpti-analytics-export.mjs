import {
  PERSONA_CODES,
  createAnalyticsStore,
  getErrorMessage,
  json,
  listAllKeys
} from "./_mpti-analytics.mjs";

const EXPORT_TOKEN_ENV_NAME = "MPTI_ANALYTICS_EXPORT_TOKEN";
const QUESTION_IDS = [
  ...Array.from({ length: 15 }, (_, index) => `q${index + 1}`),
  "ghost_gate_q1",
  "ghost_gate_q2"
];
const CSV_COLUMNS = [
  "result_id",
  "result_key",
  "recorded_at",
  "persona_code",
  "persona_name",
  "special",
  "similarity",
  ...QUESTION_IDS.flatMap((questionId) => [
    `${questionId}_value`,
    `${questionId}_option_code`,
    `${questionId}_option_label`
  ])
];

function getRequestToken(request, url) {
  const authorization = request.headers.get("authorization");
  if (authorization) {
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    if (match) return match[1].trim();
  }

  return url.searchParams.get("token")?.trim() || "";
}

function parseTimestampParam(value, endOfDay = false) {
  if (typeof value !== "string" || !value.trim()) return null;

  const trimmed = value.trim();
  const dayMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dayMatch) {
    const [, year, month, day] = dayMatch;
    return Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      endOfDay ? 23 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 999 : 0
    );
  }

  const parsed = Date.parse(trimmed);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function extractTimestampFromKey(key) {
  const match = key.match(/\/(\d{13})-/);
  return match ? Number(match[1]) : null;
}

function extractResultId(key) {
  const match = key.match(/\/(\d{13}-[^/]+)\.json$/);
  if (match) return match[1];

  return key.replace(/^results\//, "").replace(/\.json$/, "");
}

function sanitizeFilenamePart(value) {
  return String(value).trim().replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "all";
}

function buildFilename({ persona, from, to }) {
  const parts = ["mpti-results"];
  if (persona) parts.push(persona.toLowerCase());
  if (from) parts.push(`from-${sanitizeFilenamePart(from)}`);
  if (to) parts.push(`to-${sanitizeFilenamePart(to)}`);
  parts.push(new Date().toISOString().replace(/[:.]/g, "-"));
  return `${parts.join("-")}.csv`;
}

function escapeCsvCell(value) {
  if (value === null || value === undefined) return "";

  const text = String(value);
  if (!/[",\r\n]/.test(text)) return text;

  return `"${text.replace(/"/g, "\"\"")}"`;
}

function buildAnswerMap(answers) {
  const answerMap = new Map();
  if (!Array.isArray(answers)) return answerMap;

  for (const answer of answers) {
    if (!answer || typeof answer !== "object" || typeof answer.questionId !== "string") continue;
    answerMap.set(answer.questionId, answer);
  }

  return answerMap;
}

function createCsvRow(key, record) {
  const answerMap = buildAnswerMap(record.answers);
  const row = {
    result_id: extractResultId(key),
    result_key: key,
    recorded_at: typeof record.recordedAt === "string" ? record.recordedAt : "",
    persona_code: typeof record.personaCode === "string" ? record.personaCode : "",
    persona_name: typeof record.personaName === "string" ? record.personaName : "",
    special: record.special ? "true" : "false",
    similarity: Number.isFinite(record.similarity) ? String(record.similarity) : ""
  };

  for (const questionId of QUESTION_IDS) {
    const answer = answerMap.get(questionId);
    row[`${questionId}_value`] = Number.isFinite(answer?.selectedValue) ? String(answer.selectedValue) : "";
    row[`${questionId}_option_code`] =
      typeof answer?.selectedOptionCode === "string" ? answer.selectedOptionCode : "";
    row[`${questionId}_option_label`] =
      typeof answer?.selectedOptionLabel === "string" ? answer.selectedOptionLabel : "";
  }

  return row;
}

function buildCsv(rows) {
  const lines = [
    CSV_COLUMNS.join(","),
    ...rows.map((row) => CSV_COLUMNS.map((column) => escapeCsvCell(row[column])).join(","))
  ];

  return `\uFEFF${lines.join("\r\n")}`;
}

async function loadRows(store, keys) {
  const rows = [];

  for (let index = 0; index < keys.length; index += 25) {
    const chunk = keys.slice(index, index + 25);
    const chunkRows = await Promise.all(
      chunk.map(async (key) => {
        const entry = await store.getWithMetadata(key, {
          type: "json",
          consistency: "strong"
        });

        if (!entry || !entry.data || typeof entry.data !== "object") return null;
        return createCsvRow(key, entry.data);
      })
    );

    rows.push(...chunkRows.filter(Boolean));
  }

  return rows;
}

export default async (request) => {
  if (request.method !== "GET") {
    return json(
      { error: "Method Not Allowed" },
      { status: 405, headers: { Allow: "GET" } }
    );
  }

  const url = new URL(request.url);
  const format = (url.searchParams.get("format") || "csv").trim().toLowerCase();
  if (format !== "csv") {
    return json({ error: "Unsupported export format" }, { status: 400 });
  }

  const expectedToken = process.env[EXPORT_TOKEN_ENV_NAME]?.trim() || "";
  if (!expectedToken) {
    return json(
      {
        error: "Analytics export token is not configured",
        env: EXPORT_TOKEN_ENV_NAME
      },
      { status: 503 }
    );
  }

  const requestToken = getRequestToken(request, url);
  if (!requestToken) {
    return json({ error: "Missing export token" }, { status: 401 });
  }
  if (requestToken !== expectedToken) {
    return json({ error: "Invalid export token" }, { status: 403 });
  }

  const persona = (url.searchParams.get("persona") || "").trim().toUpperCase();
  if (persona && !PERSONA_CODES.includes(persona)) {
    return json({ error: "Unknown persona filter" }, { status: 400 });
  }

  const fromRaw = url.searchParams.get("from");
  const toRaw = url.searchParams.get("to");
  const fromTimestamp = parseTimestampParam(fromRaw, false);
  const toTimestamp = parseTimestampParam(toRaw, true);

  if (Number.isNaN(fromTimestamp)) {
    return json({ error: "Invalid from date" }, { status: 400 });
  }
  if (Number.isNaN(toTimestamp)) {
    return json({ error: "Invalid to date" }, { status: 400 });
  }
  if (fromTimestamp !== null && toTimestamp !== null && fromTimestamp > toTimestamp) {
    return json({ error: "from must be earlier than or equal to to" }, { status: 400 });
  }

  try {
    const store = createAnalyticsStore();
    const prefix = persona ? `results/${encodeURIComponent(persona)}/` : "results/";
    const allKeys = await listAllKeys(store, prefix);
    const filteredKeys = allKeys
      .filter((key) => {
        const timestamp = extractTimestampFromKey(key);
        if (timestamp === null) return true;
        if (fromTimestamp !== null && timestamp < fromTimestamp) return false;
        if (toTimestamp !== null && timestamp > toTimestamp) return false;
        return true;
      })
      .sort((left, right) => {
        const leftTimestamp = extractTimestampFromKey(left) || 0;
        const rightTimestamp = extractTimestampFromKey(right) || 0;
        return leftTimestamp - rightTimestamp;
      });

    const rows = await loadRows(store, filteredKeys);
    const csv = buildCsv(rows);

    return new Response(csv, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${buildFilename({
          persona,
          from: fromRaw,
          to: toRaw
        })}"`
      }
    });
  } catch (error) {
    return json(
      {
        error: "Analytics export failed",
        detail: getErrorMessage(error)
      },
      { status: 503 }
    );
  }
};
