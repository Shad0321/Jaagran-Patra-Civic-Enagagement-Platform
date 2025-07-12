import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Plus, Search, Edit, Trash2, Eye, Calendar, User } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

// Category options constant
const CATEGORY_OPTIONS = [
  { value: 'GENERAL', label: 'General' },
  { value: 'ANNOUNCEMENT', label: 'Announcement' },
  { value: 'ALERT', label: 'Alert' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'EVENT', label: 'Event' }
];

// Move NewsModal component outside to prevent re-rendering
const NewsModal = ({ isOpen, onClose, title, onSubmit, formData, setFormData }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <form onSubmit={onSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows="8"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
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
            
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                className="mr-2"
              />
              <label className="text-sm font-medium text-gray-700">Published</label>
            </div>
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
    category: 'GENERAL',
    isPublished: false,
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

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      content: '',
      category: 'GENERAL',
      isPublished: false,
      publishedAt: ''
    });
    setSelectedNews(null);
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const handleAddNews = useCallback(async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/news', formData);
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
    try {
      await api.put(`/admin/news/${selectedNews.id}`, formData);
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
      await api.patch(`/admin/news/${newsId}/publish`, { isPublished: !currentStatus });
      toast.success(`News ${!currentStatus ? 'published' : 'unpublished'} successfully`);
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
      category: newsItem.category,
      isPublished: newsItem.isPublished,
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      newsItem.category === 'ALERT' ? 'bg-red-100 text-red-800' :
                      newsItem.category === 'ANNOUNCEMENT' ? 'bg-blue-100 text-blue-800' :
                      newsItem.category === 'EVENT' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {newsItem.category}
                    </span>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    newsItem.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {newsItem.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{newsItem.content}</p>
                
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <User className="h-4 w-4 mr-1" />
                  <span className="mr-4">{newsItem.author?.name || 'Admin'}</span>
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{new Date(newsItem.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => handlePublishToggle(newsItem.id, newsItem.isPublished)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      newsItem.isPublished
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    {newsItem.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditNews(newsItem)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteNews(newsItem.id)}
                      className="text-red-600 hover:text-red-900"
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
      />
    </div>
  );
};

export default NewsManagement;
