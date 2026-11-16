import { isRecord } from "../../src/core/guards";
import { readRetryAfterSeconds } from "./retry";
import type { FetchLike, FetchResponseLike } from "./wikipedia";

export const DEFAULT_LLM_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai";

const DEFAULT_DELAY_MS = 7000;
const ERROR_SNIPPET_LENGTH = 300;

export interface GenerationRequest {
  system: string;
  user: string;
}

export interface TextGenerator {
  generate(request: GenerationRequest): Promise<string>;
}

export interface LlmConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  delayMs: number;
}

export interface ChatGeneratorOptions {
  fetchImpl: FetchLike;
  sleep: (millis: number) => Promise<void>;
  maxAttempts: number;
  defaultRetrySeconds: number;
}

export function loadLlmConfig(env: Readonly<Record<string, string | undefined>>): LlmConfig {
  const apiKey = env.LLM_API_KEY?.trim() ?? "";
  const model = env.LLM_MODEL?.trim() ?? "";
  const missing = [apiKey === "" ? "LLM_API_KEY" : "", model === "" ? "LLM_MODEL" : ""].filter(
    (name) => name !== "",
  );
  if (missing.length > 0) {
    throw new Error(
      `Missing ${missing.join(" and ")}. Set LLM_API_KEY to your provider key and LLM_MODEL to a model id (run content:models to list them).`,
    );
  }
  const delay = Number(env.LLM_DELAY_MS);
  return {
    baseUrl: env.LLM_BASE_URL?.trim() || DEFAULT_LLM_BASE_URL,
    apiKey,
    model,
    delayMs: env.LLM_DELAY_MS && Number.isFinite(delay) && delay >= 0 ? delay : DEFAULT_DELAY_MS,
  };
}

function trimTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, "");
}

export function buildChatCompletionsUrl(baseUrl: string): string {
  return `${trimTrailingSlashes(baseUrl)}/chat/completions`;
}

export function extractChatText(body: unknown): string {
  if (!isRecord(body) || !Array.isArray(body.choices)) {
    return "";
  }
  const message = isRecord(body.choices[0]) ? body.choices[0].message : undefined;
  if (!isRecord(message)) {
    return "";
  }
  const content = message.content;
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((part) => (isRecord(part) && typeof part.text === "string" ? part.text : ""))
      .join("");
  }
  return "";
}

async function readErrorSnippet(response: { text?: () => Promise<string> }): Promise<string> {
  if (!response.text) {
    return "";
  }
  try {
    return (await response.text()).replace(/\s+/g, " ").slice(0, ERROR_SNIPPET_LENGTH);
  } catch {
    return "";
  }
}

async function readChatReply(response: FetchResponseLike): Promise<string> {
  if (!response.ok) {
    throw new Error(
      `The model API returned HTTP ${response.status}: ${await readErrorSnippet(response)}`,
    );
  }
  const text = extractChatText(await response.json());
  if (text.trim() === "") {
    throw new Error("The model API returned an empty reply");
  }
  return text;
}

export class ChatCompletionsGenerator implements TextGenerator {
  private readonly options: ChatGeneratorOptions;

  constructor(
    private readonly config: LlmConfig,
    overrides: Partial<ChatGeneratorOptions> = {},
  ) {
    this.options = {
      fetchImpl: fetch as unknown as FetchLike,
      sleep: (millis) => new Promise((resolve) => setTimeout(resolve, millis)),
      maxAttempts: 5,
      defaultRetrySeconds: 20,
      ...overrides,
    };
  }

  async generate(request: GenerationRequest): Promise<string> {
    const { fetchImpl, sleep, maxAttempts, defaultRetrySeconds } = this.options;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      await sleep(this.config.delayMs);
      const response = await fetchImpl(buildChatCompletionsUrl(this.config.baseUrl), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          temperature: 0.4,
          messages: [
            { role: "system", content: request.system },
            { role: "user", content: request.user },
          ],
        }),
      });
      if (response.status === 429 || response.status === 503) {
        const retrySeconds = readRetryAfterSeconds(
          response.headers.get("retry-after"),
          defaultRetrySeconds * attempt,
        );
        await sleep(retrySeconds * 1000);
      } else {
        return await readChatReply(response);
      }
    }
    throw new Error("The model API kept rate limiting the request");
  }
}

export async function listModelIds(
  config: LlmConfig,
  fetchImpl: FetchLike = fetch as unknown as FetchLike,
): Promise<string[]> {
  const response = await fetchImpl(`${trimTrailingSlashes(config.baseUrl)}/models`, {
    headers: { Authorization: `Bearer ${config.apiKey}` },
  });
  if (!response.ok) {
    throw new Error(
      `The model API returned HTTP ${response.status}: ${await readErrorSnippet(response)}`,
    );
  }
  const body = await response.json();
  if (!isRecord(body) || !Array.isArray(body.data)) {
    return [];
  }
  return body.data
    .map((entry) => (isRecord(entry) && typeof entry.id === "string" ? entry.id : ""))
    .filter((id) => id !== "")
    .map((id) => id.replace(/^models\//, ""))
    .sort();
}
