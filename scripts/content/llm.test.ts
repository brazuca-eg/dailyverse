import { describe, expect, it } from "vitest";
import {
  buildChatCompletionsUrl,
  ChatCompletionsGenerator,
  DEFAULT_LLM_BASE_URL,
  extractChatText,
  listModelIds,
  loadLlmConfig,
  type LlmConfig,
} from "./llm";
import type { FetchInit, FetchLike, FetchResponseLike } from "./wikipedia";

const config: LlmConfig = {
  baseUrl: "https://llm.example.com/v1/",
  apiKey: "secret-key",
  model: "test-model",
  delayMs: 50,
};

function createResponse(
  status: number,
  body: unknown,
  options: { headers?: Record<string, string>; text?: string } = {},
): FetchResponseLike {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => options.headers?.[name.toLowerCase()] ?? null },
    json: async () => body,
    text: async () => options.text ?? "",
  };
}

function chatBody(content: unknown): unknown {
  return { choices: [{ message: { content } }] };
}

describe("loadLlmConfig", () => {
  it("reads the settings and defaults the provider and delay", () => {
    const loaded = loadLlmConfig({ LLM_API_KEY: " key ", LLM_MODEL: "m" });
    expect(loaded).toEqual({
      baseUrl: DEFAULT_LLM_BASE_URL,
      apiKey: "key",
      model: "m",
      delayMs: 7000,
    });
  });

  it("lets every setting be overridden to switch provider", () => {
    const loaded = loadLlmConfig({
      LLM_API_KEY: "k",
      LLM_MODEL: "m",
      LLM_BASE_URL: "https://api.example.com/v1",
      LLM_DELAY_MS: "250",
    });
    expect(loaded.baseUrl).toBe("https://api.example.com/v1");
    expect(loaded.delayMs).toBe(250);
  });

  it("ignores an invalid delay", () => {
    expect(loadLlmConfig({ LLM_API_KEY: "k", LLM_MODEL: "m", LLM_DELAY_MS: "soon" }).delayMs).toBe(
      7000,
    );
  });

  it("names every missing setting", () => {
    expect(() => loadLlmConfig({})).toThrow("Missing LLM_API_KEY and LLM_MODEL");
    expect(() => loadLlmConfig({ LLM_API_KEY: "k" })).toThrow("Missing LLM_MODEL");
  });
});

describe("buildChatCompletionsUrl", () => {
  it("appends the path whether or not the base URL ends with a slash", () => {
    expect(buildChatCompletionsUrl("https://a.example/v1")).toBe(
      "https://a.example/v1/chat/completions",
    );
    expect(buildChatCompletionsUrl("https://a.example/v1///")).toBe(
      "https://a.example/v1/chat/completions",
    );
  });
});

describe("extractChatText", () => {
  it("reads string content", () => {
    expect(extractChatText(chatBody("hello"))).toBe("hello");
  });

  it("joins content parts", () => {
    expect(extractChatText(chatBody([{ text: "a" }, { text: "b" }, { image: "x" }]))).toBe("ab");
  });

  it("returns an empty string for unexpected shapes", () => {
    expect(extractChatText(null)).toBe("");
    expect(extractChatText({ choices: [] })).toBe("");
    expect(extractChatText({ choices: [{ message: {} }] })).toBe("");
  });
});

describe("ChatCompletionsGenerator", () => {
  it("sends the key, model and both prompts, and returns the reply text", async () => {
    let seenUrl = "";
    let seenInit: FetchInit | undefined;
    const fetchImpl: FetchLike = async (url, init) => {
      seenUrl = url;
      seenInit = init;
      return createResponse(200, chatBody("the reply"));
    };
    const generator = new ChatCompletionsGenerator(config, { fetchImpl, sleep: async () => {} });
    expect(await generator.generate({ system: "be brief", user: "hi" })).toBe("the reply");
    expect(seenUrl).toBe("https://llm.example.com/v1/chat/completions");
    expect(seenInit?.method).toBe("POST");
    expect(seenInit?.headers?.Authorization).toBe("Bearer secret-key");
    const body = JSON.parse(seenInit?.body ?? "{}");
    expect(body.model).toBe("test-model");
    expect(body.messages).toEqual([
      { role: "system", content: "be brief" },
      { role: "user", content: "hi" },
    ]);
  });

  it("pauses before each request and honours retry-after when rate limited", async () => {
    const responses = [
      createResponse(429, {}, { headers: { "retry-after": "9" } }),
      createResponse(200, chatBody("second try")),
    ];
    const sleeps: number[] = [];
    const generator = new ChatCompletionsGenerator(config, {
      fetchImpl: async () => responses.shift() as FetchResponseLike,
      sleep: async (millis) => {
        sleeps.push(millis);
      },
    });
    expect(await generator.generate({ system: "s", user: "u" })).toBe("second try");
    expect(sleeps).toEqual([50, 9000, 50]);
  });

  it("backs off for longer on each retry when no retry-after is given", async () => {
    const responses = [
      createResponse(503, {}),
      createResponse(429, {}),
      createResponse(200, chatBody("ok")),
    ];
    const sleeps: number[] = [];
    const generator = new ChatCompletionsGenerator(config, {
      fetchImpl: async () => responses.shift() as FetchResponseLike,
      sleep: async (millis) => {
        sleeps.push(millis);
      },
      defaultRetrySeconds: 10,
    });
    await generator.generate({ system: "s", user: "u" });
    expect(sleeps).toEqual([50, 10_000, 50, 20_000, 50]);
  });

  it("gives up after too many rate limit responses", async () => {
    const generator = new ChatCompletionsGenerator(config, {
      fetchImpl: async () => createResponse(429, {}),
      sleep: async () => {},
      maxAttempts: 2,
    });
    await expect(generator.generate({ system: "s", user: "u" })).rejects.toThrow(
      "kept rate limiting",
    );
  });

  it("reports an API error with its status and message but never the key", async () => {
    const generator = new ChatCompletionsGenerator(config, {
      fetchImpl: async () => createResponse(401, {}, { text: '{"error":"API key not valid"}' }),
      sleep: async () => {},
    });
    const error = await generator
      .generate({ system: "s", user: "u" })
      .catch((reason: Error) => reason);
    expect((error as Error).message).toContain("HTTP 401");
    expect((error as Error).message).toContain("API key not valid");
    expect((error as Error).message).not.toContain("secret-key");
  });

  it("fails clearly on an empty reply", async () => {
    const generator = new ChatCompletionsGenerator(config, {
      fetchImpl: async () => createResponse(200, chatBody("   ")),
      sleep: async () => {},
    });
    await expect(generator.generate({ system: "s", user: "u" })).rejects.toThrow("empty reply");
  });
});

describe("listModelIds", () => {
  it("returns sorted model ids without the models/ prefix", async () => {
    let seenUrl = "";
    const fetchImpl: FetchLike = async (url) => {
      seenUrl = url;
      return createResponse(200, {
        data: [{ id: "models/b-model" }, { id: "a-model" }, { nope: 1 }],
      });
    };
    expect(await listModelIds(config, fetchImpl)).toEqual(["a-model", "b-model"]);
    expect(seenUrl).toBe("https://llm.example.com/v1/models");
  });

  it("fails clearly when the provider rejects the key", async () => {
    const fetchImpl: FetchLike = async () => createResponse(403, {}, { text: "forbidden" });
    await expect(listModelIds(config, fetchImpl)).rejects.toThrow("HTTP 403");
  });

  it("returns nothing for an unexpected body", async () => {
    expect(await listModelIds(config, async () => createResponse(200, {}))).toEqual([]);
  });
});
