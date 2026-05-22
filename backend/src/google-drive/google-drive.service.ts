import { Injectable, Logger } from '@nestjs/common';
import { google, docs_v1 } from 'googleapis';

export interface DocumentSection {
  title: string;
  content: string;
}

export interface ParsedDocument {
  title: string;
  sections: DocumentSection[];
}

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);

  async fetchDocument(
    accessToken: string,
    documentId: string,
  ): Promise<ParsedDocument> {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    // First, get file metadata to determine the MIME type
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const fileMeta = await drive.files.get({
      fileId: documentId,
      fields: 'id,name,mimeType',
    });

    const mimeType = fileMeta.data.mimeType || '';
    const fileName = fileMeta.data.name || 'Untitled';

    this.logger.log({ msg: 'Fetching Google Drive file', documentId, mimeType });

    // Google Docs — use Docs API for tab support
    if (mimeType === 'application/vnd.google-apps.document') {
      return this.fetchGoogleDoc(oauth2Client, documentId);
    }

    // Plain text or markdown files — download content directly
    if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
      return this.fetchDriveFile(drive, documentId, fileName);
    }

    // Fallback: try to fetch as Google Doc
    return this.fetchGoogleDoc(oauth2Client, documentId);
  }

  private async fetchGoogleDoc(
    oauth2Client: InstanceType<typeof google.auth.OAuth2>,
    documentId: string,
  ): Promise<ParsedDocument> {
    const docs = google.docs({ version: 'v1', auth: oauth2Client });

    this.logger.log({ msg: 'Fetching Google Doc', documentId });

    const response = await docs.documents.get({
      documentId,
      includeTabsContent: true,
    });

    const document = response.data;
    const title = document.title || 'Untitled';

    const sections = this.parseTabs(document);

    this.logger.log({
      msg: 'Google Doc fetched successfully',
      documentId,
      title,
      sectionCount: sections.length,
    });

    return { title, sections };
  }

  private async fetchDriveFile(
    drive: ReturnType<typeof google.drive>,
    fileId: string,
    fileName: string,
  ): Promise<ParsedDocument> {
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'text' },
    );

    const content = response.data as string;
    const title = fileName.replace(/\.(md|txt)$/i, '');

    this.logger.log({
      msg: 'Drive file fetched successfully',
      fileId,
      title,
      contentLength: content.length,
    });

    return {
      title,
      sections: [{ title: 'Main', content }],
    };
  }

  private parseTabs(document: docs_v1.Schema$Document): DocumentSection[] {
    const tabs = document.tabs;

    if (!tabs || tabs.length === 0) {
      // Fallback to body content if no tabs
      const content = this.extractBodyContent(document.body);
      return [{ title: 'Main', content }];
    }

    if (tabs.length === 1) {
      const tab = tabs[0];
      const content = this.extractTabContent(tab);
      return [{ title: 'Main', content }];
    }

    return tabs.map((tab, index) => ({
      title: tab.tabProperties?.title || `Section ${(index + 1).toString()}`,
      content: this.extractTabContent(tab),
    }));
  }

  private extractTabContent(tab: docs_v1.Schema$Tab): string {
    const body = tab.documentTab?.body;
    if (!body) {
      return '';
    }
    return this.extractBodyContent(body);
  }

  private extractBodyContent(body: docs_v1.Schema$Body | undefined): string {
    if (!body?.content) {
      return '';
    }

    const textParts: string[] = [];

    for (const element of body.content) {
      if (element.paragraph) {
        const paragraphText = this.extractParagraphText(element.paragraph);
        if (paragraphText) {
          textParts.push(paragraphText);
        }
      }
    }

    return textParts.join('\n');
  }

  private extractParagraphText(paragraph: docs_v1.Schema$Paragraph): string {
    if (!paragraph.elements) {
      return '';
    }

    return paragraph.elements
      .map((element) => element.textRun?.content || '')
      .join('');
  }
}
