import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

export interface InvokeParams {
  systemPrompt: string;
  userMessage: string;
}

@Injectable()
export class BedrockService {
  private readonly logger = new Logger(BedrockService.name);
  private readonly client: BedrockRuntimeClient;
  private readonly modelId: string;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION');
    this.modelId = this.configService.get<string>('AWS_BEDROCK_MODEL_ID')!;

    this.client = new BedrockRuntimeClient({ region });
  }

  async invoke(params: InvokeParams): Promise<string> {
    const { systemPrompt, userMessage } = params;

    const command = new InvokeModelCommand({
      modelId: this.modelId,
      contentType: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: userMessage }],
          },
        ],
      }),
    });

    const startTime = Date.now();
    const response = await this.client.send(command);
    const durationMs = Date.now() - startTime;

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    this.logger.log({
      msg: 'Bedrock invocation complete',
      modelId: this.modelId,
      durationMs,
      inputTokens: responseBody.usage?.input_tokens,
      outputTokens: responseBody.usage?.output_tokens,
    });

    const textBlocks = (responseBody.content || []).filter(
      (block: { type: string }) => block.type === 'text',
    );

    return textBlocks.map((block: { text: string }) => block.text).join('');
  }
}
