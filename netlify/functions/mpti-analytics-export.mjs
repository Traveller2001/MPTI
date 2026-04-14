import {
  PERSONA_CODES,
  createAnalyticsStore,
  getErrorMessage,
  json,
  listAllKeys
} from "./_mpti-analytics.mjs";

const EXPORT_TOKEN_ENV_NAME = "MPTI_ANALYTICS_EXPORT_TOKEN";
const MAX_SYNC_EXPORT_ROWS = 2000;
const EXPORT_READ_BATCH_SIZE = 100;
const QUESTION_IDS = [
  ...Array.from({ length: 18 }, (_, index) => `q${index + 1}`),
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
  ]),
  "feedback_verdict",
  "feedback_recorded_at",
  "feedback_updated_at"
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

function parseNonNegativeIntegerParam(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;

  const text = String(value).trim();
  if (!/^\d+$/.test(text)) return Number.NaN;

  return Number(text);
}

function parsePositiveIntegerParam(value) {
  if (value === null || value === undefined || value === "") return null;

  const text = String(value).trim();
  if (!/^\d+$/.test(text)) return Number.NaN;

  const number = Number(text);
  return number > 0 ? number : Number.NaN;
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

function buildFilename({ persona, from, to, offset, count, totalCount }) {
  const parts = ["mpti-results"];
  if (persona) parts.push(persona.toLowerCase());
  if (from) parts.push(`from-${sanitizeFilenamePart(from)}`);
  if (to) parts.push(`to-${sanitizeFilenamePart(to)}`);
  if (count > 0 && (offset > 0 || count < totalCount)) {
    parts.push(`rows-${offset + 1}-${offset + count}`);
    parts.push(`of-${totalCount}`);
  }
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

  const fb = record.feedback && typeof record.feedback === "object" ? record.feedback : {};
  row.feedback_verdict = typeof fb.verdict === "string" ? fb.verdict : "";
  row.feedback_recorded_at = typeof fb.recordedAt === "string" ? fb.recordedAt : "";
  row.feedback_updated_at = typeof fb.updatedAt === "string" ? fb.updatedAt : "";

  return row;
}

function buildCsvLine(row) {
  return CSV_COLUMNS.map((column) => escapeCsvCell(row[column])).join(",");
}

function buildChunkExampleUrls(url, totalCount, startOffset = 0) {
  const examples = [];

  for (
    let offset = startOffset;
    offset < totalCount && examples.length < 3;
    offset += MAX_SYNC_EXPORT_ROWS
  ) {
    const chunkUrl = new URL(url.toString());
    chunkUrl.searchParams.set("format", "csv");
    chunkUrl.searchParams.set("limit", String(MAX_SYNC_EXPORT_ROWS));
    chunkUrl.searchParams.set("offset", String(offset));
    examples.push(chunkUrl.toString());
  }

  return examples;
}

function createExportMetadata({
  url,
  persona,
  from,
  to,
  offset,
  limit,
  totalCount
}) {
  const remainingCount = Math.max(totalCount - offset, 0);
  const effectiveLimit = limit ?? Math.min(remainingCount, MAX_SYNC_EXPORT_ROWS);
  const nextOffset = offset + effectiveLimit < totalCount ? offset + effectiveLimit : null;
  const downloadUrl = new URL(url.toString());
  downloadUrl.searchParams.set("format", "csv");
  if (limit) {
    downloadUrl.searchParams.set("limit", String(limit));
  } else {
    downloadUrl.searchParams.delete("limit");
  }
  downloadUrl.searchParams.set("offset", String(offset));

  const metadata = {
    ok: true,
    persona: persona || null,
    from: from || null,
    to: to || null,
    totalCount,
    remainingCount,
    offset,
    limit,
    maxRowsPerRequest: MAX_SYNC_EXPORT_ROWS,
    needsChunking: remainingCount > MAX_SYNC_EXPORT_ROWS,
    downloadUrl: downloadUrl.toString()
  };

  if (nextOffset !== null) {
    const nextUrl = new URL(downloadUrl.toString());
    nextUrl.searchParams.set("offset", String(nextOffset));
    metadata.nextOffset = nextOffset;
    metadata.nextDownloadUrl = nextUrl.toString();
  }

  if (remainingCount > MAX_SYNC_EXPORT_ROWS) {
    metadata.examples = buildChunkExampleUrls(url, totalCount, offset);
  }

  return metadata;
}

function createCsvStream(store, keys) {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`\uFEFF${CSV_COLUMNS.join(",")}\r\n`));

      for (let index = 0; index < keys.length; index += EXPORT_READ_BATCH_SIZE) {
        const chunk = keys.slice(index, index + EXPORT_READ_BATCH_SIZE);
        const chunkLines = await Promise.all(
          chunk.map(async (key) => {
            const entry = await store.get(key, { type: "json" });
            if (!entry || typeof entry !== "object") return null;
            return buildCsvLine(createCsvRow(key, entry));
          })
        );

        const lines = chunkLines.filter(Boolean);
        if (!lines.length) continue;
        controller.enqueue(encoder.encode(`${lines.join("\r\n")}\r\n`));
      }

      controller.close();
    }
  });
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
  if (format !== "csv" && format !== "json") {
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
  const offset = parseNonNegativeIntegerParam(url.searchParams.get("offset"), 0);
  const limit = parsePositiveIntegerParam(url.searchParams.get("limit"));
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
  if (Number.isNaN(offset)) {
    return json({ error: "Invalid offset" }, { status: 400 });
  }
  if (Number.isNaN(limit)) {
    return json({ error: "Invalid limit" }, { status: 400 });
  }
  if (limit !== null && limit > MAX_SYNC_EXPORT_ROWS) {
    return json(
      {
        error: "limit is too large",
        maxRowsPerRequest: MAX_SYNC_EXPORT_ROWS
      },
      { status: 400 }
    );
  }

  try {
    const store = createAnalyticsStore({ consistency: "eventual" });
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

    const totalCount = filteredKeys.length;

    if (format === "json") {
      return json(
        createExportMetadata({
          url,
          persona,
          from: fromRaw,
          to: toRaw,
          offset,
          limit,
          totalCount
        })
      );
    }

    const remainingCount = Math.max(totalCount - offset, 0);

    if (limit === null && remainingCount > MAX_SYNC_EXPORT_ROWS) {
      return json(
        {
          error: "Export too large for a single synchronous request",
          totalCount,
          remainingCount,
          maxRowsPerRequest: MAX_SYNC_EXPORT_ROWS,
          detail: "Retry with limit and offset, or narrow persona/from/to filters.",
          examples: buildChunkExampleUrls(url, totalCount, offset)
        },
        { status: 413 }
      );
    }

    const selectedKeys =
      limit === null
        ? filteredKeys.slice(offset)
        : filteredKeys.slice(offset, offset + limit);
    const headers = new Headers({
      "Cache-Control": "no-store",
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${buildFilename({
        persona,
        from: fromRaw,
        to: toRaw,
        offset,
        count: selectedKeys.length,
        totalCount
      })}"`
    });
    headers.set("X-MPTI-Export-Total-Count", String(totalCount));
    headers.set("X-MPTI-Export-Offset", String(offset));
    headers.set("X-MPTI-Export-Returned-Count", String(selectedKeys.length));
    headers.set("X-MPTI-Export-Max-Rows-Per-Request", String(MAX_SYNC_EXPORT_ROWS));
    headers.set("X-MPTI-Export-Has-More", String(offset + selectedKeys.length < totalCount));
    if (limit !== null) {
      headers.set("X-MPTI-Export-Limit", String(limit));
    }
    if (offset + selectedKeys.length < totalCount) {
      const nextOffset = offset + selectedKeys.length;
      headers.set("X-MPTI-Export-Next-Offset", String(nextOffset));
    }

    return new Response(createCsvStream(store, selectedKeys), {
      headers
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
