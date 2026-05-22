import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BedrockService } from './bedrock.service';

// Mock the AWS SDK
jest.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  InvokeModelCommand: jest.fn().mockImplementation((params) => params),
}));

import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

describe('BedrockService', () => {
  let service: BedrockService;
  let configService: { get: jest.Mock };
  let mockSend: jest.Mock;

  beforeEach(async () => {
    configService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          AWS_REGION: 'eu-west-1',
          AWS_BEDROCK_MODEL_ID: 'anthropic.claude-3-sonnet-20240229-v1:0',
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

    // Access the mock client's send method
    mockSend = (BedrockRuntimeClient as jest.Mock).mock.results[0]?.value?.send;
    if (!mockSend) {
      // Re-instantiate to capture the mock
      const clientInstance = (BedrockRuntimeClient as jest.Mock).mock.instances[0];
      mockSend = clientInstance?.send || jest.fn();
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('invoke', () => {
    it('returns text content from Bedrock response', async () => {
      const responseBody = {
        content: [{ type: 'text', text: '# Analysis Report\n\nThis is the output.' }],
      };

      // Get the actual client instance used by the service
      const clientInstances = (BedrockRuntimeClient as jest.Mock).mock.results;
      const clientMock = clientInstances[clientInstances.length - 1]?.value;
      clientMock.send.mockResolvedValue({
        body: new TextEncoder().encode(JSON.stringify(responseBody)),
      });

      const result = await service.invoke({
        systemPrompt: 'You are a helpful assistant.',
        userMessage: 'Analyse this conversation.',
      });

      expect(result).toBe('# Analysis Report\n\nThis is the output.');
    });

    it('uses configured model ID and region', async () => {
      expect(configService.get).toHaveBeenCalledWith('AWS_REGION');
      expect(configService.get).toHaveBeenCalledWith('AWS_BEDROCK_MODEL_ID');
    });

    it('throws when Bedrock returns an error response', async () => {
      const clientInstances = (BedrockRuntimeClient as jest.Mock).mock.results;
      const clientMock = clientInstances[clientInstances.length - 1]?.value;
      clientMock.send.mockRejectedValue(new Error('Throttling: Rate exceeded'));

      await expect(
        service.invoke({
          systemPrompt: 'You are a helpful assistant.',
          userMessage: 'Analyse this.',
        }),
      ).rejects.toThrow('Throttling: Rate exceeded');
    });

    it('handles response with empty content array', async () => {
      const responseBody = { content: [] };

      const clientInstances = (BedrockRuntimeClient as jest.Mock).mock.results;
      const clientMock = clientInstances[clientInstances.length - 1]?.value;
      clientMock.send.mockResolvedValue({
        body: new TextEncoder().encode(JSON.stringify(responseBody)),
      });

      const result = await service.invoke({
        systemPrompt: 'System',
        userMessage: 'User',
      });

      expect(result).toBe('');
    });
  });
});
