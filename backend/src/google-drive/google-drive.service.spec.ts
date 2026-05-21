import { GoogleDriveService } from './google-drive.service';
import { google } from 'googleapis';

jest.mock('googleapis', () => {
  const mockGet = jest.fn();
  return {
    google: {
      auth: {
        OAuth2: jest.fn().mockImplementation(() => ({
          setCredentials: jest.fn(),
        })),
      },
      docs: jest.fn().mockReturnValue({
        documents: { get: mockGet },
      }),
    },
    __mockGet: mockGet,
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { __mockGet: mockGet } = require('googleapis') as {
  __mockGet: jest.Mock;
};

describe('GoogleDriveService', () => {
  let service: GoogleDriveService;

  beforeEach(() => {
    service = new GoogleDriveService();
    jest.clearAllMocks();
  });

  describe('fetchDocument', () => {
    it('returns parsed document with single tab as Main section', async () => {
      mockGet.mockResolvedValue({
        data: {
          title: 'Test Document',
          tabs: [
            {
              tabProperties: { title: 'Tab 1' },
              documentTab: {
                body: {
                  content: [
                    {
                      paragraph: {
                        elements: [{ textRun: { content: 'Hello World\n' } }],
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      });

      const result = await service.fetchDocument(
        'mock-access-token',
        'mock-document-id',
      );

      expect(result.title).toBe('Test Document');
      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].title).toBe('Main');
      expect(result.sections[0].content).toContain('Hello World');
    });

    it('returns multiple sections for multiple tabs', async () => {
      mockGet.mockResolvedValue({
        data: {
          title: 'Multi-Tab Doc',
          tabs: [
            {
              tabProperties: { title: 'Meeting Notes' },
              documentTab: {
                body: {
                  content: [
                    {
                      paragraph: {
                        elements: [{ textRun: { content: 'Notes here\n' } }],
                      },
                    },
                  ],
                },
              },
            },
            {
              tabProperties: { title: 'Action Items' },
              documentTab: {
                body: {
                  content: [
                    {
                      paragraph: {
                        elements: [{ textRun: { content: 'Item 1\n' } }],
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      });

      const result = await service.fetchDocument(
        'mock-access-token',
        'mock-document-id',
      );

      expect(result.title).toBe('Multi-Tab Doc');
      expect(result.sections).toHaveLength(2);
      expect(result.sections[0].title).toBe('Meeting Notes');
      expect(result.sections[0].content).toContain('Notes here');
      expect(result.sections[1].title).toBe('Action Items');
      expect(result.sections[1].content).toContain('Item 1');
    });

    it('handles document with no tabs by returning empty Main section', async () => {
      mockGet.mockResolvedValue({
        data: {
          title: 'Empty Doc',
          tabs: [],
          body: { content: [] },
        },
      });

      const result = await service.fetchDocument(
        'mock-access-token',
        'mock-document-id',
      );

      expect(result.title).toBe('Empty Doc');
      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].title).toBe('Main');
      expect(result.sections[0].content).toBe('');
    });

    it('uses section index for unnamed tabs', async () => {
      mockGet.mockResolvedValue({
        data: {
          title: 'Unnamed Tabs Doc',
          tabs: [
            {
              tabProperties: {},
              documentTab: {
                body: { content: [] },
              },
            },
            {
              tabProperties: {},
              documentTab: {
                body: { content: [] },
              },
            },
          ],
        },
      });

      const result = await service.fetchDocument(
        'mock-access-token',
        'mock-document-id',
      );

      expect(result.sections[0].title).toBe('Section 1');
      expect(result.sections[1].title).toBe('Section 2');
    });

    it('calls Google Docs API with correct parameters', async () => {
      mockGet.mockResolvedValue({
        data: {
          title: 'API Test',
          tabs: [
            {
              tabProperties: { title: 'Tab' },
              documentTab: { body: { content: [] } },
            },
          ],
        },
      });

      await service.fetchDocument('my-token', 'doc-abc-123');

      expect(google.docs).toHaveBeenCalledWith({
        version: 'v1',
        auth: expect.objectContaining({}),
      });
      expect(mockGet).toHaveBeenCalledWith({
        documentId: 'doc-abc-123',
        includeTabsContent: true,
      });
    });
  });
});
