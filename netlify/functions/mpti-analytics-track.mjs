import { randomUUID } from "node:crypto";
import {
  PERSONA_CODES,
  addFeedbackToSummary,
  addResultToSummary,
  addVisitToSummary,
  createAnalyticsStore,
  getErrorMessage,
  json,
  updateSummarySnapshot
} from "./_mpti-analytics.mjs";

const ALLOWED_RESULT_CODES = new Set(PERSONA_CODES);

function normalizeString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizePositiveInteger(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) return null;
  return number;
}

function normalizeNullableNumber(value) {
  return Number.isFinite(value) ? value : null;
}

function normalizeAnswers(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      return {
        questionId: normalizeString(item.questionId),
        questionNumber: normalizePositiveInteger(item.questionNumber),
        questionKind: normalizeString(item.questionKind),
        dimension: normalizeString(item.dimension, null),
        displayOrder: normalizePositiveInteger(item.displayOrder),
        selectedValue: normalizePositiveInteger(item.selectedValue),
        selectedOptionIndex: normalizePositiveInteger(item.selectedOptionIndex),
        selectedOptionCode: normalizeString(item.selectedOptionCode, null),
        selectedOptionLabel: normalizeString(item.selectedOptionLabel)
      };
    })
    .filter((item) => item && item.questionId);
}

export default async (request) => {
  if (request.method !== "POST") {
    return json(
      { error: "Method Not Allowed" },
      { status: 405, headers: { Allow: "POST" } }
    );
  }

  const store = createAnalyticsStore();
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const now = Date.now();
  const id = randomUUID();
  const recordedAt = new Date(now).toISOString();

  try {
    if (payload?.kind === "visit") {
      await updateSummarySnapshot(store, (summary) => addVisitToSummary(summary, recordedAt));
      await store.setJSON(`visits/${now}-${id}.json`, {
        kind: "visit",
        path: typeof payload.path === "string" ? payload.path : "/",
        recordedAt
      });

      return json({ ok: true });
    }

    if (payload?.kind === "result") {
      const personaCode = typeof payload.personaCode === "string" ? payload.personaCode : "";
      if (!ALLOWED_RESULT_CODES.has(personaCode)) {
        return json({ error: "Unknown personaCode" }, { status: 400 });
      }

      await updateSummarySnapshot(store, (summary) => {
        const next = addResultToSummary(summary, personaCode, recordedAt);
        return addFeedbackToSummary(next, personaCode, "accurate", null);
      });
      const resultKey = `results/${encodeURIComponent(personaCode)}/${now}-${id}.json`;
      await store.setJSON(resultKey, {
        kind: "result",
        personaCode,
        personaName: typeof payload.personaName === "string" ? payload.personaName : "",
        special: Boolean(payload.special),
        similarity: Number.isFinite(payload.similarity) ? payload.similarity : null,
        answers: normalizeAnswers(payload.answers),
        feedback: { verdict: "accurate", recordedAt, updatedAt: null },
        recordedAt
      });

      return json({ ok: true, resultKey });
    }

    if (payload?.kind === "feedback") {
      const resultKey = typeof payload.resultKey === "string" ? payload.resultKey : "";
      const verdict = payload.verdict;

      if (!resultKey.startsWith("results/")) {
        return json({ error: "Invalid resultKey" }, { status: 400 });
      }
      if (verdict !== "accurate" && verdict !== "inaccurate") {
        return json({ error: "Invalid verdict" }, { status: 400 });
      }

      const entry = await store.get(resultKey, { type: "json", consistency: "strong" });
      if (!entry || entry.kind !== "result") {
        return json({ error: "Result record not found" }, { status: 404 });
      }

      const prev = entry.feedback && typeof entry.feedback === "object" ? entry.feedback : {};
      const previousVerdict = prev.verdict;
      entry.feedback = {
        verdict,
        recordedAt: prev.recordedAt || recordedAt,
        updatedAt: prev.recordedAt ? recordedAt : null
      };

      await store.setJSON(resultKey, entry);

      const personaCode = typeof entry.personaCode === "string" ? entry.personaCode : "";
      if (ALLOWED_RESULT_CODES.has(personaCode)) {
        await updateSummarySnapshot(store, (summary) =>
          addFeedbackToSummary(summary, personaCode, verdict, previousVerdict)
        );
      }

      return json({ ok: true });
    }
  } catch (error) {
    return json(
      {
        error: "Analytics write failed",
        detail: getErrorMessage(error)
      },
      { status: 503 }
    );
  }

  return json({ error: "Unknown analytics kind" }, { status: 400 });
};
