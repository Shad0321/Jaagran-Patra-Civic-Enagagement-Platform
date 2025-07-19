import React, { useMemo, useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Loader from '../../components/common/Loader';

// Error boundary component for ReactQuill
class ReactQuillErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('ReactQuill Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback to a simple textarea
      return (
        <div className="border border-gray-300 rounded-md">
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-300 text-sm text-gray-600">
            Rich text editor unavailable - using fallback editor
          </div>
          <textarea
            value={this.props.value || ''}
            onChange={(e) => this.props.onChange(e.target.value)}
            placeholder={this.props.placeholder}
            className="w-full p-3 border-0 focus:outline-none resize-none"
            style={{ minHeight: this.props.height || '200px' }}
            rows={10}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

const RichTextEditor = ({ value, onChange, placeholder = "Enter content...", height = "200px" }) => {
  const [isClient, setIsClient] = useState(false);
  const quillRef = useRef(null);

  // Ensure component only renders on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],
        [{ 'align': [] }],
        ['link', 'image', 'video'],
        ['blockquote', 'code-block'],
        ['clean']
      ],
    },
    clipboard: {
      matchVisual: false,
    }
  }), []);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'color', 'background',
    'align', 'script',
    'direction',
    'code-block'
  ];

  // Show loading state during SSR
  if (!isClient) {
    return (
      <Loader/>
    );
  }

  return (
    <ReactQuillErrorBoundary value={value} onChange={onChange} placeholder={placeholder} height={height}>
      <div className="rich-text-editor" style={{ marginBottom: '50px' }}>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value || ''}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          style={{ height: height }}
          preserveWhitespace={true}
        />
      </div>
    </ReactQuillErrorBoundary>
  );
};

export default RichTextEditor;
