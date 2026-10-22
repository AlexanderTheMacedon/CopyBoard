import type { ReactNode } from 'react';

/**
 * Minimal, safe Markdown preview for the Composer skeleton: headings, lists, fenced code and paragraphs become React elements.
 * User text is never interpreted as HTML (Blueprint 04 §7.3). A full Markdown pipeline is a later feature run.
 */
export function renderMarkdown(source: string): ReactNode[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) blocks.push(<p key={blocks.length}>{paragraph.join(' ')}</p>);
    paragraph = [];
  };
  const flushList = () => {
    if (list.length)
      blocks.push(
        <ul key={blocks.length}>
          {list.map((entry, i) => (
            <li key={i}>{entry}</li>
          ))}
        </ul>,
      );
    list = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (line.startsWith('```')) {
      flushParagraph();
      flushList();
      const code: string[] = [];
      for (i++; i < lines.length && !(lines[i] ?? '').startsWith('```'); i++) code.push(lines[i] ?? '');
      blocks.push(
        <pre key={blocks.length}>
          <code>{code.join('\n')}</code>
        </pre>,
      );
      continue;
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1]?.length ?? 1;
      const text = heading[2] ?? '';
      blocks.push(level === 1 ? <h1 key={blocks.length}>{text}</h1> : level === 2 ? <h2 key={blocks.length}>{text}</h2> : <h3 key={blocks.length}>{text}</h3>);
      continue;
    }
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      flushParagraph();
      list.push(bullet[1] ?? '');
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    flushList();
    paragraph.push(line.trim());
  }
  flushParagraph();
  flushList();
  return blocks;
}

export function MarkdownPreview({ source }: { source: string }) {
  return <div className="cb-markdown">{renderMarkdown(source)}</div>;
}
