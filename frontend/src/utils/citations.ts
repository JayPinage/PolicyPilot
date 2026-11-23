import { Citation, ParsedMessageContent } from '../types/chat';

/**
 * Parses citations from an assistant message content.
 * Matches backend formats:
 * - [Source: HR Policy Manual, Page: 27]
 * - Source: HR Policy Manual\nPage: 27
 */
export function parseCitations(content: string): ParsedMessageContent {
  if (!content) {
    return { text: '', citations: [] };
  }

  // Normalize Unicode fullwidth citation brackets to standard ASCII brackets
  content = content.replace(/【/g, '[').replace(/】/g, ']');

  const citations: Citation[] = [];
  const citationMap = new Map<string, string>(); // source -> page to deduplicate

  // 1. Extract bracket format: [Source: Document Name, Page: 27]
  const bracketRegex = /\[Source:\s*([^,\]]+),\s*Page:\s*([^\]]+)\]/gi;
  let match: RegExpExecArray | null;

  while ((match = bracketRegex.exec(content)) !== null) {
    const source = match[1].trim();
    const rawPage = match[2].trim();
    const page = rawPage.endsWith('.0') ? rawPage.slice(0, -2) : rawPage;

    const key = `${source.toLowerCase()}::${page}`;
    if (!citationMap.has(key)) {
      citationMap.set(key, page);
      citations.push({ source, page });
    }
  }

  // 2. Also match multiline format if present:
  const multilineRegex = /(?:^|\n)Source:\s*([^\n]+)\s*\nPage:\s*([^\n\r]+)/gi;
  while ((match = multilineRegex.exec(content)) !== null) {
    const source = match[1].trim();
    const rawPage = match[2].trim();
    const page = rawPage.endsWith('.0') ? rawPage.slice(0, -2) : rawPage;

    const key = `${source.toLowerCase()}::${page}`;
    if (!citationMap.has(key)) {
      citationMap.set(key, page);
      citations.push({ source, page });
    }
  }

  // 3. Process text line by line to keep Markdown table syntax intact:
  // - If inside a table row (starts with '|'): replace [Source: ...] with clean 'Page X' so the cell isn't empty/broken
  // - If in regular prose: strip [Source: ...] so it renders in the dedicated citation cards below
  const lines = content.split('\n');
  const cleanedLines = lines.map((line) => {
    const isTableRow = line.trim().startsWith('|');

    if (isTableRow) {
      // In table row: replace [Source: Doc, Page: 70.0] with 'Page 70'
      return line.replace(
        /\[Source:\s*([^,\]]+),\s*Page:\s*(\d+(?:\.0)?)\]/gi,
        (_, __, rawPage) => {
          const page = rawPage.endsWith('.0') ? rawPage.slice(0, -2) : rawPage;
          return `Page ${page}`;
        }
      );
    } else {
      // Regular prose: strip citation brackets
      return line.replace(bracketRegex, '');
    }
  });

  const cleanText = cleanedLines
    .join('\n')
    .replace(multilineRegex, '')
    .trim();

  return {
    text: cleanText,
    citations,
  };
}
