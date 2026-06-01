import { env } from "../../config/env.js";
import { ApiError } from "../../lib/ApiError.js";
import { logger } from "../../lib/logger.js";

export type AiCategory =
  | "Administrasi & Akun"
  | "Capstone & Reporting"
  | "Materi & Kurikulum"
  | "Teknis/Lain-lain";

export interface AiPredictResponse {
  status: "ok" | "low_confidence";
  input: string;
  cleaned_text: string;
  label: number;
  category: AiCategory | string;
  confidence: number;
  all_scores: Record<string, number>;
  message: string;
  reply?: string;
}

export interface AiClientOptions {
  withReply?: boolean;
}

export interface AiClient {
  predict(question: string, opts?: AiClientOptions): Promise<AiPredictResponse>;
}

class HttpAiClient implements AiClient {
  constructor(
    private baseUrl: string,
    private timeoutMs: number,
  ) {}

  async predict(
    question: string,
    opts: AiClientOptions = {},
  ): Promise<AiPredictResponse> {
    const endpoint = opts.withReply ? "/predict-with-reply" : "/predict";
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorBody = await res
          .json()
          .catch(() => ({ detail: "AI service error" }));
        const detail =
          (errorBody as { detail?: string }).detail ?? "AI service error";
        throw new ApiError(
          res.status === 503 ? 503 : 502,
          "INTERNAL_ERROR",
          `AI service: ${detail}`,
        );
      }

      return (await res.json()) as AiPredictResponse;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new ApiError(
          504,
          "INTERNAL_ERROR",
          `AI service timeout setelah ${this.timeoutMs}ms`,
        );
      }
      logger.error({ err, url }, "AI service unreachable");
      throw new ApiError(
        503,
        "INTERNAL_ERROR",
        "AI service tidak dapat diakses",
      );
    } finally {
      clearTimeout(timer);
    }
  }
}

export const aiClient: AiClient = new HttpAiClient(
  env.AI_SERVICE_URL,
  env.AI_SERVICE_TIMEOUT_MS,
);

logger.info({ url: env.AI_SERVICE_URL }, "AI client initialized");

export function deriveUrgency(
  question: string,
  category: string,
  confidence: number,
): "low" | "medium" | "high" {
  const lowerQ = question.toLowerCase();
  const HIGH_KEYWORDS =
    /urgent|tolong|segera|asap|deadline|hari ini|sekarang|mendesak|error|gagal|tidak bisa|stuck/i;
  if (HIGH_KEYWORDS.test(lowerQ)) return "high";
  if (confidence < 0.7) return "medium";
  if (category === "Teknis/Lain-lain" && confidence < 0.85) return "medium";
  return "low";
}
