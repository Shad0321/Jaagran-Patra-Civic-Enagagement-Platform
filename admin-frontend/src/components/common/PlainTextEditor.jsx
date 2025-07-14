import React, { useRef } from 'react';

const PlainTextEditor = ({ value, onChange, placeholder = "Enter content...", height = "200px" }) => {
  const textareaRef = useRef(null);

  const insertText = (before, after = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
    onChange(newText);

    // Set cursor position after the inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const formatButtons = [
    { label: 'B', action: () => insertText('**', '**'), title: 'Bold' },
    { label: 'I', action: () => insertText('*', '*'), title: 'Italic' },
    { label: 'H1', action: () => insertText('# '), title: 'Heading 1' },
    { label: 'H2', action: () => insertText('## '), title: 'Heading 2' },
    { label: 'H3', action: () => insertText('### '), title: 'Heading 3' },
    { label: 'Link', action: () => insertText('[', '](url)'), title: 'Link' },
    { label: 'List', action: () => insertText('\n- '), title: 'Bullet List' },
    { label: 'Quote', action: () => insertText('\n> '), title: 'Quote' },
  ];

  return (
    <div className="border border-gray-300 rounded-md">
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-300 flex flex-wrap gap-1">
        {formatButtons.map((button, index) => (
          <button
            key={index}
            type="button"
            onClick={button.action}
            title={button.title}
            className="px-2 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {button.label}
          </button>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-3 border-0 focus:outline-none resize-none"
        style={{ minHeight: height }}
        rows={10}
      />
      <div className="px-3 py-2 bg-gray-50 border-t border-gray-300 text-xs text-gray-600">
        Markdown formatting supported: **bold**, *italic*, # heading, [link](url), - list, {'>'}quote
      </div>
    </div>
  );
};

export default PlainTextEditor;
