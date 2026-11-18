import React from 'react';

/**
 * Lightweight, safe Markdown renderer for AI Tutor responses & scientific explanations.
 * Renders headings, bold, italic, inline code/formulas, unordered & ordered lists without external dependencies.
 */
function renderInline(text) {
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={key++} className="font-bold text-slate-900 dark:text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={key++}
          className="rounded-md bg-sky-100/80 px-1.5 py-0.5 font-mono text-[12px] font-semibold text-blue-900 dark:bg-blue-950 dark:text-sky-200"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={key++} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

export default function MarkdownContent({ content = '', className = '' }) {
  const lines = String(content || '').split('\n');
  const blocks = [];
  let listItems = [];
  let listType = null;

  const flushList = () => {
    if (listItems.length === 0) return;
    const Tag = listType === 'ol' ? 'ol' : 'ul';
    blocks.push(
      <Tag
        key={`list-${blocks.length}`}
        className={`my-1.5 space-y-1 pl-5 ${listType === 'ol' ? 'list-decimal' : 'list-disc'}`}
      >
        {listItems.map((item, idx) => (
          <li key={idx}>{renderInline(item)}</li>
        ))}
      </Tag>
    );
    listItems = [];
    listType = null;
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      return;
    }
    const ulMatch = line.match(/^[-•*]\s+(.+)/);
    const olMatch = line.match(/^\d+\.\s+(.+)/);
    if (ulMatch) {
      if (listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push(ulMatch[1]);
      return;
    }
    if (olMatch) {
      if (listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push(olMatch[1]);
      return;
    }
    flushList();
    if (line.startsWith('### ')) {
      blocks.push(
        <h4 key={idx} className="mt-2 text-xs font-extrabold uppercase tracking-wide text-blue-700 dark:text-sky-300">
          {renderInline(line.slice(4))}
        </h4>
      );
    } else if (line.startsWith('## ')) {
      blocks.push(
        <h3 key={idx} className="mt-2 text-sm font-extrabold text-slate-900 dark:text-white">
          {renderInline(line.slice(3))}
        </h3>
      );
    } else {
      blocks.push(
        <p key={idx} className="leading-relaxed">
          {renderInline(line)}
        </p>
      );
    }
  });
  flushList();

  return <div className={`space-y-1.5 ${className}`}>{blocks}</div>;
}
