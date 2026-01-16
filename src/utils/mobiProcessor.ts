import { initMobiFile, initKf8File, type Mobi, type Kf8 } from '@lingo-reader/mobi-parser';

export interface MobiChapter {
  id: string;
  title: string;
  content: string;
  position: number; // Position in the book (0-based chapter index)
}

export interface MobiMetadata {
  title?: string;
  author?: string;
  publisher?: string;
  language?: string;
  isbn?: string;
  description?: string;
}

export interface MobiParseResult {
  chapters: MobiChapter[];
  metadata: MobiMetadata;
  fullText: string;
}

/**
 * Parse a MOBI file and extract chapters, metadata, and full text
 */
export async function parseMobiFile(file: File): Promise<MobiParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Try to parse as MOBI or KF8
    let parser: Mobi | Kf8;
    let toc;
    let metadata;
    
    try {
      // Try KF8 first (newer format)
      parser = await initKf8File(uint8Array);
      toc = parser.getToc();
      metadata = parser.getMetadata();
    } catch {
      // Fall back to MOBI format
      parser = await initMobiFile(uint8Array);
      toc = parser.getToc();
      metadata = parser.getMetadata();
    }

    // Extract metadata
    const processedMetadata: MobiMetadata = {
      title: metadata.title || file.name.replace(/\.mobi$/i, ''),
      author: metadata.author?.[0] || 'Unknown Author',
      publisher: metadata.publisher || undefined,
      language: metadata.language || undefined,
      isbn: undefined,
      description: metadata.description || undefined,
    };

    // Extract chapters from TOC
    const processedChapters: MobiChapter[] = [];
    let fullText = '';

    if (toc && toc.length > 0) {
      // Process TOC items
      await processChaptersFromToc(toc, parser, processedChapters);
      
      // If TOC didn't yield content, try using spine
      if (processedChapters.length === 0 || processedChapters.every(ch => ch.content.startsWith('['))) {
        console.log('TOC chapters empty, trying spine...');
        processedChapters.length = 0; // Clear placeholder chapters
        await processChaptersFromSpine(parser, processedChapters);
      }
      
      // Build full text
      fullText = processedChapters.map(ch => ch.content).join('\n\n');
    } else {
      console.log('No TOC found, trying spine...');
      await processChaptersFromSpine(parser, processedChapters);
      fullText = processedChapters.map(ch => ch.content).join('\n\n');
    }
    
    // If still no content, show error
    if (processedChapters.length === 0) {
      processedChapters.push({
        id: 'chapter-0',
        title: processedMetadata.title || 'Full Book',
        content: 'No chapters could be extracted from this MOBI file. The file may be corrupted or use an unsupported format.',
        position: 0,
      });
      fullText = processedChapters[0].content;
    }

    return {
      chapters: processedChapters,
      metadata: processedMetadata,
      fullText,
    };
  } catch (error) {
    console.error('Error parsing MOBI file:', error);
    throw new Error(`Failed to parse MOBI file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Process chapters from TOC
 */
async function processChaptersFromToc(
  toc: { label: string; href: string; children?: unknown[] }[],
  parser: Mobi | Kf8,
  chapters: MobiChapter[]
): Promise<void> {
  for (let i = 0; i < toc.length; i++) {
    const item = toc[i];
    const chapterIndex = chapters.length;
    
    try {
      // The href might include a hash/anchor, extract just the ID part
      const chapterId = item.href.replace(/^#/, '').split('#')[0];
      
      // Get chapter content
      const chapterHtml = parser.loadChapter(chapterId);
      
      if (!chapterHtml || !chapterHtml.html) {
        console.warn(`Chapter ${item.label} returned no content. href: ${item.href}, id: ${chapterId}`);
        chapters.push({
          id: `chapter-${chapterIndex}`,
          title: item.label || `Chapter ${chapterIndex + 1}`,
          content: '[Chapter content could not be loaded]',
          position: chapterIndex,
        });
        continue;
      }
      
      const cleanContent = stripHtmlTags(chapterHtml.html);
      
      if (!cleanContent || cleanContent.trim().length === 0) {
        console.warn(`Chapter ${item.label} has no text content after HTML stripping`);
      }
      
      chapters.push({
        id: `chapter-${chapterIndex}`,
        title: item.label || `Chapter ${chapterIndex + 1}`,
        content: cleanContent || '[Empty chapter]',
        position: chapterIndex,
      });
    } catch (error) {
      console.error(`Failed to load chapter: ${item.label}`, error);
      // Add a placeholder chapter
      chapters.push({
        id: `chapter-${chapterIndex}`,
        title: item.label || `Chapter ${chapterIndex + 1}`,
        content: '[Error loading chapter content]',
        position: chapterIndex,
      });
    }
    
    // Process nested chapters
    if (item.children && item.children.length > 0) {
      await processChaptersFromToc(
        item.children as { label: string; href: string; children?: unknown[] }[],
        parser,
        chapters
      );
    }
  }
}

/**
 * Process chapters from spine (reading order)
 */
async function processChaptersFromSpine(
  parser: Mobi | Kf8,
  chapters: MobiChapter[]
): Promise<void> {
  try {
    const spine = parser.getSpine();
    console.log(`Processing ${spine.length} items from spine`);
    
    for (let i = 0; i < spine.length; i++) {
      const spineItem = spine[i];
      const chapterIndex = chapters.length;
      
      try {
        const chapterHtml = parser.loadChapter(spineItem.id);
        
        if (!chapterHtml || !chapterHtml.html) {
          console.warn(`Spine item ${i} (${spineItem.id}) returned no content`);
          continue;
        }
        
        const cleanContent = stripHtmlTags(chapterHtml.html);
        
        if (!cleanContent || cleanContent.trim().length < 10) {
          // Skip very short or empty chapters (likely just formatting)
          console.warn(`Spine item ${i} has minimal content, skipping`);
          continue;
        }
        
        chapters.push({
          id: `chapter-${chapterIndex}`,
          title: `Chapter ${chapterIndex + 1}`,
          content: cleanContent,
          position: chapterIndex,
        });
      } catch (error) {
        console.error(`Failed to load spine item ${i}:`, error);
      }
    }
  } catch (error) {
    console.error('Failed to get spine:', error);
  }
}

/**
 * Strip HTML tags from text while preserving paragraph breaks
 */
function stripHtmlTags(html: string): string {
  // Replace paragraph and break tags with newlines
  let text = html.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  
  // Remove all other HTML tags
  text = text.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  text = decodeHtmlEntities(text);
  
  // Clean up extra whitespace
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.trim();
  
  return text;
}

/**
 * Decode common HTML entities
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
    '&mdash;': '—',
    '&ndash;': '–',
    '&hellip;': '…',
    '&rsquo;': "'",
    '&lsquo;': "'",
    '&rdquo;': '"',
    '&ldquo;': '"',
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }

  // Handle numeric entities
  decoded = decoded.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
  decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

  return decoded;
}

/**
 * Extract text from a specific chapter
 */
export function getChapterText(chapters: MobiChapter[], chapterId: string): string {
  const chapter = chapters.find(ch => ch.id === chapterId);
  return chapter?.content || '';
}

/**
 * Get chapter by position (index)
 */
export function getChapterByPosition(chapters: MobiChapter[], position: number): MobiChapter | undefined {
  return chapters.find(ch => ch.position === position);
}
