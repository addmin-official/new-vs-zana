import { GeminiProvider } from "./GeminiProvider.ts";

export interface FirebaseAIGenerateParams {
  model: string;
  contents: unknown;
  config?: unknown;
  env?: unknown;
  authToken?: string;
  apiKey?: string;
}

export class FirebaseAIProvider {
  static async generate(params: FirebaseAIGenerateParams): Promise<{ text: string }> {
    return GeminiProvider.generate({
      apiKey: params.apiKey,
      model: params.model,
      contents: params.contents,
      config: params.config,
      env: params.env,
    });
  }
}
