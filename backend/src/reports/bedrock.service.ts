import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface InvokeParams {
  systemPrompt: string;
  userMessage: string;
}

@Injectable()
export class BedrockService {
  private readonly logger = new Logger(BedrockService.name);
  private readonly apiKey: string;
  private readonly modelId: string;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION')!;
    this.modelId = this.configService.get<string>('AWS_BEDROCK_MODEL_ID')!;
    this.apiKey = this.configService.get<string>('AWS_BEDROCK_API_KEY')!;
  }

  async invoke(params: InvokeParams): Promise<string> {
    const { systemPrompt, userMessage } = params;

    const url = `https://bedrock-runtime.${this.region}.amazonaws.com/model/${this.modelId}/converse`;

    const body = JSON.stringify({
      system: [{ text: systemPrompt }],
      messages: [
        {
          role: 'user',
          content: [{ text: userMessage }],
        },
      ],
      inferenceConfig: {
        maxTokens: 4096,
      },
    });

    const startTime = Date.now();

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body,
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error({
        msg: 'Bedrock request failed',
        modelId: this.modelId,
        errorMessage: errMsg,
      });
      throw new ServiceUnavailableException('AI service unavailable: network error');
    }

    const durationMs = Date.now() - startTime;

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error({
        msg: 'Bedrock returned error',
        modelId: this.modelId,
        statusCode: response.status,
        errorBody,
      });
      throw new ServiceUnavailableException(
        `AI service error: ${response.status}`,
      );
    }

    const responseBody = await response.json();

    this.logger.log({
      msg: 'Bedrock invocation complete',
      modelId: this.modelId,
      durationMs,
      inputTokens: responseBody.usage?.inputTokens,
      outputTokens: responseBody.usage?.outputTokens,
    });

    // Converse API returns output.message.content[].text
    const contentBlocks = responseBody.output?.message?.content || [];
    const textBlocks = contentBlocks.filter(
      (block: { text?: string }) => block.text !== undefined,
    );

    return textBlocks.map((block: { text: string }) => block.text).join('');
  }
}
