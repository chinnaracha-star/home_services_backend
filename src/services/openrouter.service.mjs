import axios from "axios";
import { env } from "../configs/env.mjs";
import { HttpError } from "../utils/http-error.mjs";

const openRouterApi = axios.create({
  baseURL: "https://openrouter.ai/api/v1",
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

function providerUnavailable() {
  return new HttpError(
    503,
    "CHAT_PROVIDER_UNAVAILABLE",
    "The AI assistant is temporarily unavailable",
  );
}

export async function requestOpenRouter({ messages, responseFormat, validate }) {
  if (!env.openRouterApiKey || !env.openRouterModel) {
    throw providerUnavailable();
  }

  const headers = {
    Authorization: `Bearer ${env.openRouterApiKey}`,
    ...(env.openRouterReferer ? { "HTTP-Referer": env.openRouterReferer } : {}),
    ...(env.openRouterTitle ? { "X-Title": env.openRouterTitle } : {}),
  };

  const models = [...new Set([env.openRouterModel, ...env.openRouterFallbackModels])];
  for (const model of models) {
    try {
      const response = await openRouterApi.post(
        "/chat/completions",
        {
          model,
          messages,
          max_tokens: 500,
          temperature: 0.2,
          ...(responseFormat ? { response_format: responseFormat } : {}),
          ...(responseFormat ? { provider: { require_parameters: true } } : {}),
        },
        { headers },
      );
      const content = response.data?.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim()) {
        throw new Error("Empty provider response");
      }
      const normalized = content.trim();
      return validate ? validate(normalized) : normalized;
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : null;
      const code = axios.isAxiosError(error)
        ? error.response?.data?.error?.code || error.code
        : error?.code || "INVALID_RESPONSE";
      console.warn("OpenRouter model attempt failed", { model, status, code });
    }
  }
  throw providerUnavailable();
}
