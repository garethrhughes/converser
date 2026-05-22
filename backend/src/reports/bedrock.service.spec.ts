import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { BedrockService } from './bedrock.service';

describe('BedrockService', () => {
  let service: BedrockService;
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    configService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          AWS_REGION: 'eu-west-1',
          AWS_BEDROCK_MODEL_ID: 'anthropic.claude-3-sonnet-20240229-v1:0',
          AWS_BEDROCK_API_KEY: 'test-api-key-12345',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BedrockService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<BedrockService>(BedrockService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('invoke', () => {
    it('returns text content from Bedrock Converse API response', async () => {
      const mockResponse = {
        output: {
          message: {
            role: 'assistant',
            content: [{ text: '# Analysis Report\n\nThis is the output.' }],
          },
        },
        usage: { inputTokens: 100, outputTokens: 50 },
      };

      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await service.invoke({
        systemPrompt: 'You are a helpful assistant.',
        userMessage: 'Analyse this conversation.',
      });

      expect(result).toBe('# Analysis Report\n\nThis is the output.');
    });

    it('calls the correct Bedrock endpoint with Bearer auth', async () => {
      const mockResponse = {
        output: { message: { content: [{ text: 'output' }] } },
        usage: {},
      };

      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await service.invoke({
        systemPrompt: 'System',
        userMessage: 'User',
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://bedrock-runtime.eu-west-1.amazonaws.com/model/anthropic.claude-3-sonnet-20240229-v1:0/converse',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key-12345',
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('sends system prompt and user message in Converse format', async () => {
      const mockResponse = {
        output: { message: { content: [{ text: 'output' }] } },
        usage: {},
      };

      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await service.invoke({
        systemPrompt: 'Be helpful.',
        userMessage: 'Hello world.',
      });

      const callBody = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
      expect(callBody.system).toEqual([{ text: 'Be helpful.' }]);
      expect(callBody.messages).toEqual([
        { role: 'user', content: [{ text: 'Hello world.' }] },
      ]);
      expect(callBody.inferenceConfig.maxTokens).toBe(4096);
    });

    it('throws ServiceUnavailableException when Bedrock returns an error status', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'Rate exceeded',
      } as unknown as Response);

      await expect(
        service.invoke({
          systemPrompt: 'System',
          userMessage: 'User',
        }),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('throws ServiceUnavailableException on network error', async () => {
      jest.spyOn(global, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(
        service.invoke({
          systemPrompt: 'System',
          userMessage: 'User',
        }),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('handles response with empty content array', async () => {
      const mockResponse = {
        output: { message: { content: [] } },
        usage: {},
      };

      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await service.invoke({
        systemPrompt: 'System',
        userMessage: 'User',
      });

      expect(result).toBe('');
    });
  });
});
