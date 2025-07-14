import React, { useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Link2,
  Image,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Undo,
  Redo
} from 'lucide-react';

const ModernRichTextEditor = ({ value, onChange, placeholder = "Enter content...", height = "300px" }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) {
      // Set initial content only if different
      if (value && editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
      // Force LTR direction
      forceLTRDirection();
    }
  }, [value]);

  const forceLTRDirection = () => {
    if (editorRef.current) {
      editorRef.current.style.direction = 'ltr';
      editorRef.current.style.textAlign = 'left';
      editorRef.current.style.unicodeBidi = 'bidi-override';
      editorRef.current.setAttribute('dir', 'ltr');
    }
  };

  const handleInput = () => {
    if (editorRef.current && onChange) {
      // Force LTR direction after every input
      forceLTRDirection();
      onChange(editorRef.current.innerHTML);
    }
  };

  const executeCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    // Force LTR direction after commands
    forceLTRDirection();
    editorRef.current?.focus();
    handleInput();
  };

  const insertHTML = (html) => {
    document.execCommand('insertHTML', false, html);
    // Force LTR direction after insertions
    forceLTRDirection();
    editorRef.current?.focus();
    handleInput();
  };

  const formatBlock = (tag) => {
    document.execCommand('formatBlock', false, tag);
    // Force LTR direction after formatting
    forceLTRDirection();
    editorRef.current?.focus();
    handleInput();
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      insertHTML(`<img src="${url}" alt="Image" style="max-width: 100%; height: auto;" />`);
    }
  };

  const toolbarButtons = [
    { 
      icon: Bold, 
      command: () => executeCommand('bold'),
      title: 'Bold (Ctrl+B)',
      isActive: () => document.queryCommandState('bold')
    },
    { 
      icon: Italic, 
      command: () => executeCommand('italic'),
      title: 'Italic (Ctrl+I)',
      isActive: () => document.queryCommandState('italic')
    },
    { 
      icon: Underline, 
      command: () => executeCommand('underline'),
      title: 'Underline (Ctrl+U)',
      isActive: () => document.queryCommandState('underline')
    },
    { type: 'separator' },
    { 
      icon: Heading1, 
      command: () => formatBlock('h1'),
      title: 'Heading 1'
    },
    { 
      icon: Heading2, 
      command: () => formatBlock('h2'),
      title: 'Heading 2'
    },
    { 
      icon: Heading3, 
      command: () => formatBlock('h3'),
      title: 'Heading 3'
    },
    { type: 'separator' },
    { 
      icon: List, 
      command: () => executeCommand('insertUnorderedList'),
      title: 'Bullet List'
    },
    { 
      icon: ListOrdered, 
      command: () => executeCommand('insertOrderedList'),
      title: 'Numbered List'
    },
    { type: 'separator' },
    { 
      icon: Link2, 
      command: insertLink,
      title: 'Insert Link'
    },
    { 
      icon: Image, 
      command: insertImage,
      title: 'Insert Image'
    },
    { 
      icon: Quote, 
      command: () => formatBlock('blockquote'),
      title: 'Quote'
    },
    { 
      icon: Code, 
      command: () => executeCommand('formatBlock', 'pre'),
      title: 'Code Block'
    },
    { type: 'separator' },
    { 
      icon: Undo, 
      command: () => executeCommand('undo'),
      title: 'Undo (Ctrl+Z)'
    },
    { 
      icon: Redo, 
      command: () => executeCommand('redo'),
      title: 'Redo (Ctrl+Y)'
    }
  ];

  const handleKeyDown = (e) => {
    // Handle common keyboard shortcuts
    if (e.ctrlKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          executeCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          executeCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          executeCommand('underline');
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            executeCommand('redo');
          } else {
            executeCommand('undo');
          }
          break;
        case 'y':
          e.preventDefault();
          executeCommand('redo');
          break;
        default:
          break;
      }
    }
  };

  const handlePaste = () => {
    // Force LTR direction after paste
    setTimeout(() => {
      forceLTRDirection();
      handleInput();
    }, 0);
  };

  return (
    <div className="modern-rich-text-editor border border-gray-300 rounded-md overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
        {toolbarButtons.map((button, index) => {
          if (button.type === 'separator') {
            return (
              <div key={index} className="w-px bg-gray-300 mx-1 self-stretch" />
            );
          }

          const Icon = button.icon;
          const isActive = button.isActive ? button.isActive() : false;

          return (
            <button
              key={index}
              type="button"
              onClick={button.command}
              title={button.title}
              className={`p-2 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
              }`}
            >
              <Icon size={16} />
            </button>
          );
        })}
      </div>

      {/* Editor Content */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        className="p-3 focus:outline-none"
        style={{ 
          minHeight: height,
          maxHeight: '500px',
          overflowY: 'auto',
          direction: 'ltr',
          textAlign: 'left',
          unicodeBidi: 'bidi-override'
        }}
        data-placeholder={placeholder}
        dir="ltr"
        suppressContentEditableWarning={true}
      />

      {/* Custom CSS for placeholder and styling */}
      <style jsx>{`
        .modern-rich-text-editor {
          direction: ltr !important;
        }
        
        .modern-rich-text-editor [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
          direction: ltr !important;
        }
        
        .modern-rich-text-editor [contenteditable] {
          line-height: 1.6;
          direction: ltr !important;
          text-align: left !important;
          unicode-bidi: bidi-override !important;
        }
        
        .modern-rich-text-editor [contenteditable] *,
        .modern-rich-text-editor [contenteditable] p,
        .modern-rich-text-editor [contenteditable] div,
        .modern-rich-text-editor [contenteditable] span {
          direction: ltr !important;
          unicode-bidi: bidi-override !important;
          text-align: left !important;
        }
        
        .modern-rich-text-editor [contenteditable] h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.67em 0;
          direction: ltr !important;
          text-align: left !important;
          unicode-bidi: bidi-override !important;
        }
        
        .modern-rich-text-editor [contenteditable] h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.75em 0;
          direction: ltr !important;
          text-align: left !important;
          unicode-bidi: bidi-override !important;
        }
        
        .modern-rich-text-editor [contenteditable] h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 0.83em 0;
          direction: ltr !important;
          text-align: left !important;
          unicode-bidi: bidi-override !important;
        }
        
        .modern-rich-text-editor [contenteditable] blockquote {
          margin: 1em 0;
          padding-left: 1em;
          border-left: 3px solid #e5e7eb;
          font-style: italic;
          color: #6b7280;
          direction: ltr !important;
          text-align: left !important;
        }
        
        .modern-rich-text-editor [contenteditable] pre {
          background-color: #f3f4f6;
          padding: 1em;
          border-radius: 0.375rem;
          font-family: monospace;
          white-space: pre-wrap;
          margin: 1em 0;
          direction: ltr !important;
          text-align: left !important;
        }
        
        .modern-rich-text-editor [contenteditable] ul,
        .modern-rich-text-editor [contenteditable] ol {
          margin: 1em 0;
          padding-left: 2em;
          direction: ltr !important;
          text-align: left !important;
        }
        
        .modern-rich-text-editor [contenteditable] li {
          margin: 0.5em 0;
          direction: ltr !important;
          text-align: left !important;
        }
        
        .modern-rich-text-editor [contenteditable] a {
          color: #3b82f6;
          text-decoration: underline;
          direction: ltr !important;
        }
        
        .modern-rich-text-editor [contenteditable] img {
          max-width: 100%;
          height: auto;
          margin: 1em 0;
        }
      `}</style>
    </div>
  );
};

export default ModernRichTextEditor;