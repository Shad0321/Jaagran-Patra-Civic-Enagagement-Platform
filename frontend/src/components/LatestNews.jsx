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
import Loader from './common/Loader';

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
      className={`bg-white rounded-2xl border-2 border-primary/20 hover:shadow-lg transition-shadow duration-200 ${compact ? 'p-4' : 'p-6'}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {item.isPinned && (
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
          )}
          {item.category && (
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold border border-primary/30 bg-primary/10 text-primary`}
            >
              {item.category}
            </span>
          )}
        </div>
        <div className="flex items-center text-xs text-primary">
          <Calendar className="w-3 h-3 mr-1" />
          {formatDate(item.publishedAt)}
        </div>
      </div>

      <h3
        className={`font-bold text-primary mb-2 ${compact ? 'text-base' : 'text-xl'} line-clamp-2`}
      >
        {item.title}
      </h3>

      {item.summary && (
        <p
          className={`text-gray-700 mb-3 ${compact ? 'text-xs' : 'text-base'} line-clamp-2`}
        >
          {item.summary}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-xs text-primary">
          {item.state && (
            <div className="flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              {item.state.name}
            </div>
          )}
          {item.isNational && (
            <span className="px-2 py-1 bg-primary/10 text-primary rounded-full font-semibold border border-primary/20">
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

        {(
          <button
            onClick={() => navigate(`/news/${item.id}`)}
            className="flex items-center text-primary hover:text-primary/80 text-sm font-semibold border border-primary/30 px-3 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 transition-all cursor-pointer"
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
      <Loader/>
    );
  }

  return (
    <div className={`${showFull ? 'space-y-6' : 'space-y-4'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Newspaper className="w-5 h-5 text-primary" />
          <h2
            className={`font-extrabold text-primary ${showFull ? 'text-2xl' : 'text-lg'}`}
          >
            {showFull ? 'Latest News & Updates' : 'Latest News'}
          </h2>
        </div>

        {!showFull && news.length > 0 && (
          <button
            onClick={() => navigate('/news')}
            className="text-primary hover:text-primary/80 text-sm font-semibold flex items-center border border-primary/30 px-3 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 transition-all cursor-pointer"
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
                  className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none  focus:border-transparent ${isSearching ? 'bg-gray-50' : ''
                    }`}
                />
              </div>
            </div>

            <div className="sm:w-48">
              <div className="relative w-full">
                <select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className="w-full appearance-none px-4 py-3 bg-white border border-gray-300 rounded-xl shadow-sm text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                >
                  <option value="all" className="bg-white text-gray-800">
                    All Categories
                  </option>
                  {categories.map((cat) => (
                    <option
                      key={cat.category}
                      value={cat.category}
                      className="text-gray-800 bg-primary/10"
                    >
                      {cat.category} ({cat.count})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

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
