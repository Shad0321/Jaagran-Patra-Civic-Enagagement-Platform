import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Plus, Search, Edit, Trash2, Eye, Calendar, User } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import RichTextEditor from '../components/common/RichTextEditor';
import ModernRichTextEditor from '../components/common/ModernRichTextEditor';
import Loader from '../components/common/Loader';

// Category options constant
const CATEGORY_OPTIONS = [
  { value: 'GENERAL', label: 'General' },
  { value: 'ANNOUNCEMENT', label: 'Announcement' },
  { value: 'ALERT', label: 'Alert' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'EVENT', label: 'Event' },
  { value: 'BREAKING', label: 'Breaking News' },
  { value: 'POLITICS', label: 'Politics' },
  { value: 'GOVERNANCE', label: 'Governance' },
  { value: 'DEVELOPMENT', label: 'Development' }
];

// Utility function to generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
    .slice(0, 50);
};

// Validation helper
const validateForm = (formData) => {
  const errors = [];
  
  if (!formData.title.trim()) {
    errors.push('Title is required');
  }
  
  if (!formData.content.trim()) {
    errors.push('Content is required');
  }
  
  if (formData.summary && formData.summary.length > 500) {
    errors.push('Summary must be less than 500 characters');
  }
  
  if (formData.metaTitle && formData.metaTitle.length > 60) {
    errors.push('Meta title must be less than 60 characters');
  }
  
  if (formData.metaDescription && formData.metaDescription.length > 160) {
    errors.push('Meta description must be less than 160 characters');
  }
  
  return errors;
};

// Move NewsModal component outside to prevent re-rendering
const NewsModal = ({ isOpen, onClose, title, onSubmit, formData, setFormData, states = [] }) => {
  if (!isOpen) return null;

  const handleTagsChange = (tagsInput) => {
    const tagsArray = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({ ...prev, tags: tagsArray }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setFormData(prev => ({ 
                      ...prev, 
                      title: newTitle,
                      slug: prev.slug || generateSlug(newTitle)
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                  rows="3"
                  maxLength="500"
                  placeholder="Brief summary of the news (max 500 characters)..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Brief description for previews and search results</span>
                  <span>{formData.summary.length}/500</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  placeholder="Enter tags separated by commas"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image URL</label>
                <input
                  type="url"
                  value={formData.featuredImage}
                  onChange={(e) => setFormData(prev => ({ ...prev, featuredImage: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="url-friendly-slug"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Leave empty to auto-generate from title</span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, slug: generateSlug(prev.title) }))}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Auto-generate
                  </button>
                </div>
                {formData.slug && (
                  <p className="text-xs text-gray-600 mt-1">
                    URL will be: <span className="font-mono bg-gray-100 px-1 rounded">/news/{formData.slug}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attachments (URLs)</label>
                <textarea
                  value={Array.isArray(formData.attachments) ? formData.attachments.join('\n') : ''}
                  onChange={(e) => {
                    const urls = e.target.value.split('\n').map(url => url.trim()).filter(url => url);
                    setFormData(prev => ({ ...prev, attachments: urls }));
                  }}
                  rows="3"
                  placeholder="Enter attachment URLs (one per line)&#10;https://example.com/file1.pdf&#10;https://example.com/file2.doc"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Enter one URL per line for additional files/documents</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Publish Date</label>
                <input
                  type="datetime-local"
                  value={formData.publishedAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, publishedAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <select
                  value={formData.stateId}
                  onChange={(e) => setFormData(prev => ({ ...prev, stateId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select State (Leave empty for national)</option>
                  {states.map(state => (
                    <option key={state.id} value={state.id}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title (SEO)</label>
                <input
                  type="text"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, metaTitle: e.target.value }))}
                  maxLength="60"
                  placeholder="SEO optimized title (max 60 chars)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Title shown in search results</span>
                  <span>{formData.metaTitle.length}/60</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description (SEO)</label>
                <textarea
                  value={formData.metaDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                  rows="3"
                  maxLength="160"
                  placeholder="SEO meta description (max 160 chars)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Description shown in search results</span>
                  <span>{formData.metaDescription.length}/160</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isNational}
                    onChange={(e) => setFormData(prev => ({ ...prev, isNational: e.target.checked }))}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">National News</label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPinned: e.target.checked }))}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">Pin to Top</label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">Active</label>
                </div>
              </div>
            </div>
          </div>

          {/* Content Editor - Full Width */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
            <ModernRichTextEditor
              value={formData.content}
              onChange={(content) => setFormData(prev => ({ ...prev, content }))}
              placeholder="Write your news content here..."
              height="300px"
            />
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {title.includes('Edit') ? 'Update' : 'Add'} News
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const NewsManagement = () => {
  const [news, setNews] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    category: 'GENERAL',
    tags: [],
    isActive: true,
    isPinned: false,
    stateId: '',
    isNational: false,
    featuredImage: '',
    slug: '',
    metaTitle: '',
    metaDescription: '',
    attachments: [],
    publishedAt: ''
  });

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm
      });

      const response = await api.get(`/admin/news?${params}`);
      setNews(response.data.data?.news || []);
      setTotalPages(response.data.data?.pagination?.pages || 1);
    } catch (error) {
      toast.error('Failed to fetch news');
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  const fetchStates = useCallback(async () => {
    try {
      const response = await api.get('/admin/states'); // Assuming this endpoint exists
      setStates(response.data.data || []);
    } catch (error) {
      console.error('Error fetching states:', error);
      // Fallback to empty array if states endpoint doesn't exist
      setStates([]);
    }
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      content: '',
      summary: '',
      category: 'GENERAL',
      tags: [],
      isActive: true,
      isPinned: false,
      stateId: '',
      isNational: false,
      featuredImage: '',
      slug: '',
      metaTitle: '',
      metaDescription: '',
      attachments: [],
      publishedAt: ''
    });
    setSelectedNews(null);
  }, []);

  useEffect(() => {
    fetchNews();
    fetchStates();
  }, [fetchNews, fetchStates]);

  const handleAddNews = useCallback(async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm(formData);
    if (errors.length > 0) {
      toast.error(errors.join(', '));
      return;
    }
    
    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        attachments: formData.attachments.length > 0 ? formData.attachments : null
      };
      
      await api.post('/admin/news', submitData);
      toast.success('News added successfully');
      setShowAddModal(false);
      resetForm();
      fetchNews();
    } catch (error) {
      toast.error('Failed to add news');
      console.error('Error adding news:', error);
    }
  }, [formData, resetForm, fetchNews]);

  const handleUpdateNews = useCallback(async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm(formData);
    if (errors.length > 0) {
      toast.error(errors.join(', '));
      return;
    }
    
    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        attachments: formData.attachments.length > 0 ? formData.attachments : null
      };
      
      await api.put(`/admin/news/${selectedNews.id}`, submitData);
      toast.success('News updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchNews();
    } catch (error) {
      toast.error('Failed to update news');
      console.error('Error updating news:', error);
    }
  }, [formData, selectedNews, resetForm, fetchNews]);

  const handleDeleteNews = useCallback(async (newsId) => {
    if (window.confirm('Are you sure you want to delete this news item?')) {
      try {
        await api.delete(`/admin/news/${newsId}`);
        toast.success('News deleted successfully');
        fetchNews();
      } catch (error) {
        toast.error('Failed to delete news');
        console.error('Error deleting news:', error);
      }
    }
  }, [fetchNews]);

  const handlePublishToggle = useCallback(async (newsId, currentStatus) => {
    try {
      await api.patch(`/admin/news/${newsId}/toggle`, { isActive: !currentStatus });
      toast.success(`News ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchNews();
    } catch (error) {
      toast.error('Failed to update publication status');
      console.error('Error updating publication status:', error);
    }
  }, [fetchNews]);

  const handleEditNews = useCallback((newsItem) => {
    setSelectedNews(newsItem);
    setFormData({
      title: newsItem.title,
      content: newsItem.content,
      summary: newsItem.summary || '',
      category: newsItem.category,
      tags: newsItem.tags || [],
      isActive: newsItem.isActive,
      isPinned: newsItem.isPinned || false,
      stateId: newsItem.stateId || '',
      isNational: newsItem.isNational || false,
      featuredImage: newsItem.featuredImage || '',
      slug: newsItem.slug || '',
      metaTitle: newsItem.metaTitle || '',
      metaDescription: newsItem.metaDescription || '',
      attachments: newsItem.attachments || [],
      publishedAt: newsItem.publishedAt ? new Date(newsItem.publishedAt).toISOString().slice(0, 16) : ''
    });
    setShowEditModal(true);
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">News Management</h1>
          <p className="text-gray-600">Manage news articles and announcements</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add News
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search news..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center items-center h-64">
            <Loader/>
          </div>
        ) : (news || []).length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No news articles found</p>
          </div>
        ) : (
          (news || []).map((newsItem) => (
            <div key={newsItem.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{newsItem.title}</h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        newsItem.category === 'ALERT' ? 'bg-red-100 text-red-800' :
                        newsItem.category === 'ANNOUNCEMENT' ? 'bg-blue-100 text-blue-800' :
                        newsItem.category === 'EVENT' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {newsItem.category}
                      </span>
                      {newsItem.isPinned && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                          Pinned
                        </span>
                      )}
                      {newsItem.isNational && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          National
                        </span>
                      )}
                      {newsItem.state && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {newsItem.state.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    newsItem.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {newsItem.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                {/* Summary */}
                {newsItem.summary && (
                  <p className="text-gray-600 text-sm mb-2 italic">{newsItem.summary}</p>
                )}
                
                {/* Content Preview */}
                <div className="text-gray-600 text-sm mb-4 line-clamp-3">
                  <div dangerouslySetInnerHTML={{ __html: newsItem.content.substring(0, 200) + '...' }} />
                </div>
                
                {/* Attachments */}
                {newsItem.attachments && newsItem.attachments.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Attachments:</p>
                    <div className="flex flex-wrap gap-1">
                      {newsItem.attachments.slice(0, 3).map((attachment, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded">
                          📎 File {index + 1}
                        </span>
                      ))}
                      {newsItem.attachments.length > 3 && (
                        <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          +{newsItem.attachments.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* URL Slug */}
                {newsItem.slug && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500">Slug: <span className="font-mono text-gray-700">{newsItem.slug}</span></p>
                  </div>
                )}
                
                {/* Tags */}
                {newsItem.tags && newsItem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {newsItem.tags.map((tag, index) => (
                      <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <User className="h-4 w-4 mr-1" />
                  <span className="mr-4">{newsItem.author?.name || 'Admin'}</span>
                  <Calendar className="h-4 w-4 mr-1" />
                  <span className="mr-4">{new Date(newsItem.createdAt).toLocaleDateString()}</span>
                  {newsItem.viewCount > 0 && (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      <span>{newsItem.viewCount} views</span>
                    </>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => handlePublishToggle(newsItem.id, newsItem.isActive)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      newsItem.isActive
                        ? 'bg-red-100 text-red-800 hover:bg-red-200'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    {newsItem.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => window.open(`/news/${newsItem.slug || newsItem.id}`, '_blank')}
                      className="text-green-600 hover:text-green-900"
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditNews(newsItem)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteNews(newsItem.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md">
              {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add News Modal */}
      <NewsModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Add New News"
        onSubmit={handleAddNews}
        formData={formData}
        setFormData={setFormData}
        states={states}
      />

      {/* Edit News Modal */}
      <NewsModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        title="Edit News"
        onSubmit={handleUpdateNews}
        formData={formData}
        setFormData={setFormData}
        states={states}
      />
    </div>
  );
};

export default NewsManagement;
