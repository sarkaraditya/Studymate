import zlib from 'zlib';

function parsePdfStreams(buffer) {
  const content = buffer.toString('latin1');
  let fullText = [];

  // Find all stream ... endstream blocks in PDF
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;

  while ((match = streamRegex.exec(content)) !== null) {
    let streamData = Buffer.from(match[1], 'latin1');

    let decompressed;
    try {
      decompressed = zlib.inflateSync(streamData).toString('latin1');
    } catch {
      try {
        decompressed = zlib.inflateRawSync(streamData).toString('latin1');
      } catch {
        decompressed = streamData.toString('latin1');
      }
    }

    // Extract text from BT ... ET blocks
    const btRegex = /BT\s+([\s\S]*?)\s+ET/g;
    let btMatch;
    while ((btMatch = btRegex.exec(decompressed)) !== null) {
      const block = btMatch[1];

      // Extract (string) Tj or ' or "
      const tjRegex = /\(((?:\\\(|\\\)|[^)])*)\)\s*(?:Tj|'|")/g;
      let tjMatch;
      while ((tjMatch = tjRegex.exec(block)) !== null) {
        let str = tjMatch[1].replace(/\\([()\\])/g, '$1').replace(/\\n/g, '\n').replace(/\\r/g, '');
        if (str.trim()) fullText.push(str.trim());
      }

      // Extract [(string) 123 (string)] TJ
      const arrayRegex = /\[((?:\\\(|\\\)|[^\]])*)\]\s*TJ/g;
      let arrMatch;
      while ((arrMatch = arrayRegex.exec(block)) !== null) {
        const inner = arrMatch[1];
        const innerStrRegex = /\(((?:\\\(|\\\)|[^)])*)\)/g;
        let innerMatch;
        let arrParts = [];
        while ((innerMatch = innerStrRegex.exec(inner)) !== null) {
          let s = innerMatch[1].replace(/\\([()\\])/g, '$1');
          if (s) arrParts.push(s);
        }
        if (arrParts.length) fullText.push(arrParts.join(''));
      }
    }
  }

  // Count /Type /Page
  const pageMatches = content.match(/\/Type\s*\/Page[^s]/g);
  const pages = pageMatches ? pageMatches.length : Math.max(1, Math.ceil(fullText.length / 60));

  return {
    text: fullText.join(' ').trim(),
    pages: `${pages} pages`,
  };
}

export async function extractDocumentText(buffer, filename) {
  const ext = (filename || '').split('.').pop().toLowerCase();

  // Plain text / Markdown / Source code
  if (['txt', 'md', 'json', 'csv', 'js', 'py', 'java', 'cpp', 'c', 'html'].includes(ext)) {
    const text = buffer.toString('utf-8');
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const estPages = Math.max(1, Math.ceil(wordCount / 350));
    return {
      text,
      pages: `${estPages} pages`,
    };
  }

  // PDF extraction
  if (ext === 'pdf') {
    try {
      const result = parsePdfStreams(buffer);
      if (result.text && result.text.length > 20) {
        return result;
      }
    } catch (err) {
      console.warn('[extractDocumentText] PDF parse error:', err.message);
    }

    // Fallback: extract plain text strings from buffer
    const raw = buffer.toString('latin1');
    const matches = raw.match(/[A-Za-z0-9\s.,;:'"?!()\-]{4,}/g) || [];
    const filteredText = matches
      .map((s) => s.trim())
      .filter((s) => s.length > 5 && !s.startsWith('/'))
      .join(' ')
      .slice(0, 50000);

    const pageCountMatch = raw.match(/\/Type\s*\/Page[^s]/g);
    const pages = pageCountMatch ? `${pageCountMatch.length} pages` : '1 page';

    return {
      text: filteredText || `Document: ${filename}. (Scanned or image-based PDF)`,
      pages,
    };
  }

  // Generic fallback
  const rawText = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ').trim();
  const wordCount = rawText.split(/\s+/).filter(Boolean).length;
  const estPages = Math.max(1, Math.ceil(wordCount / 350));
  return {
    text: rawText || `Uploaded document: ${filename}`,
    pages: `${estPages} pages`,
  };
}
