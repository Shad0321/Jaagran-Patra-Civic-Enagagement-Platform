import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Newspaper,
  Calendar,
  MapPin,
  Star,
  Eye,
  ExternalLink,
  Filter,
  Search,
  Clock,
  Tag,
} from 'lucide-react';

const LatestNews = ({ userState = null, limit = 5, showFull = false }) => {
  const navigate = useNavigate();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const searchTimeoutRef = useRef(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  // Debounce search term with 100ms delay
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set searching state if there's an active search
    if (searchTerm && searchTerm !== debouncedSearchTerm) {
      setIsSearching(true);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, 100);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, debouncedSearchTerm]);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: showFull ? '10' : limit.toString(),
        ...(userState && userState !== 'all' && { state: userState }),
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
      });

      const endpoint = showFull ? '/news' : '/news/latest';
      const response = await fetch(`${apiUrl}${endpoint}?${params}`);
      const data = await response.json();

      if (data.success) {
        setNews(data.data.news || data.data);
        if (data.data.pagination) {
          setPagination(data.data.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  }, [
    apiUrl,
    page,
    showFull,
    limit,
    userState,
    selectedCategory,
    debouncedSearchTerm,
  ]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/news/categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, [apiUrl]);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page when searching
  }, []);

  const handleCategoryChange = useCallback((e) => {
    setSelectedCategory(e.target.value);
    setPage(1); // Reset to first page when changing category
  }, []);

  const handlePrevPage = useCallback(() => {
    setPage(page - 1);
  }, [page]);

  const handleNextPage = useCallback(() => {
    setPage(page + 1);
  }, [page]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  useEffect(() => {
    if (showFull) {
      fetchCategories();
    }
  }, [showFull, fetchCategories]);

  const getCategoryColor = (category) => {
    const colors = {
      GENERAL: 'bg-blue-100 text-blue-800',
      ANNOUNCEMENT: 'bg-green-100 text-green-800',
      ALERT: 'bg-red-100 text-red-800',
      UPDATE: 'bg-yellow-100 text-yellow-800',
      EVENT: 'bg-purple-100 text-purple-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const NewsCard = React.memo(({ item, compact = false }) => (
    <div
      className={`bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 ${compact ? 'p-4' : 'p-6'}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {item.isPinned && (
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
          )}
          {item.category && (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}
            >
              {item.category}
            </span>
          )}
        </div>
        <div className="flex items-center text-xs text-gray-500">
          <Calendar className="w-3 h-3 mr-1" />
          {formatDate(item.publishedAt)}
        </div>
      </div>

      <h3
        className={`font-semibold text-gray-900 mb-2 ${compact ? 'text-sm' : 'text-lg'} line-clamp-2`}
      >
        {item.title}
      </h3>

      {item.summary && (
        <p
          className={`text-gray-600 mb-3 ${compact ? 'text-xs' : 'text-sm'} line-clamp-2`}
        >
          {item.summary}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          {item.state && (
            <div className="flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              {item.state.name}
            </div>
          )}
          {item.isNational && (
            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
              National
            </span>
          )}
          {item.viewCount > 0 && (
            <div className="flex items-center">
              <Eye className="w-3 h-3 mr-1" />
              {item.viewCount}
            </div>
          )}
        </div>

        {showFull && (
          <button
            onClick={() => navigate(`/news/${item.id}`)}
            className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Read More
            <ExternalLink className="w-3 h-3 ml-1" />
          </button>
        )}
      </div>
    </div>
  ));

  if (loading && news.length === 0) {
    return (
      <div
        className={`${showFull ? 'min-h-96' : 'h-64'} flex items-center justify-center`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading news...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${showFull ? 'space-y-6' : 'space-y-4'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Newspaper className="w-5 h-5 text-blue-600" />
          <h2
            className={`font-bold text-gray-900 ${showFull ? 'text-2xl' : 'text-lg'}`}
          >
            {showFull ? 'Latest News & Updates' : 'Latest News'}
          </h2>
        </div>

        {!showFull && news.length > 0 && (
          <button
            onClick={() => navigate('/news')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
          >
            View All
            <ExternalLink className="w-3 h-3 ml-1" />
          </button>
        )}
      </div>

      {/* Filters - Only show in full mode */}
      {showFull && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search news..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isSearching ? 'bg-gray-50' : ''
                  }`}
                />
              </div>
            </div>

            <div className="sm:w-48">
              <select
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.category} value={cat.category}>
                    {cat.category} ({cat.count})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* News List */}
      {news.length > 0 ? (
        <div className={`space-y-${showFull ? '6' : '4'}`}>
          {news.map((item) => (
            <NewsCard key={item.id} item={item} compact={!showFull} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Newspaper className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">
            No News Available
          </h3>
          <p className="text-gray-400">
            {debouncedSearchTerm || selectedCategory !== 'all'
              ? 'No news found matching your criteria'
              : 'There are no news updates at the moment'}
          </p>
        </div>
      )}

      {/* Pagination - Only show in full mode */}
      {showFull && pagination && pagination.total > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">
            Showing {(pagination.current - 1) * 10 + 1} to{' '}
            {Math.min(pagination.current * 10, pagination.totalItems)} of{' '}
            {pagination.totalItems} news
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevPage}
              disabled={!pagination.hasPrev}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>

            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded text-sm font-medium">
              {pagination.current}
            </span>

            <button
              onClick={handleNextPage}
              disabled={!pagination.hasNext}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(LatestNews);
