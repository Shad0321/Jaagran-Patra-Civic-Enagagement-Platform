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
  ChevronDown,
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

  // Debounce search term
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm && searchTerm !== debouncedSearchTerm) {
      setIsSearching(true);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, 300);

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
    setPage(1);
  }, []);

  const handleCategoryChange = useCallback((e) => {
    setSelectedCategory(e.target.value);
    setPage(1);
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
      className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 hover:shadow-xl transition-all duration-300 hover:scale-[1.01] ${compact ? 'p-4' : 'p-6'}`}
      onClick={() => navigate(`/news/${item.id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {item.isPinned && (
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
          )}
          {item.category && (
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20`}
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
        className={`font-bold text-gray-900 mb-2 ${compact ? 'text-base' : 'text-xl'} line-clamp-2`}
      >
        {item.title}
      </h3>

      {item.summary && (
        <p
          className={`text-gray-600 mb-3 ${compact ? 'text-sm' : 'text-base'} line-clamp-2`}
        >
          {item.summary}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-500">
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

        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/news/${item.id}`);
          }}
          className="flex items-center text-primary hover:text-primary/80 text-sm font-semibold border border-primary/30 px-3 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 transition-all cursor-pointer"
        >
          Read More
          <ExternalLink className="w-3 h-3 ml-1" />
        </button>
      </div>
    </div>
  ));

  if (loading && news.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-slate-50 to-primary/10 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen  overflow-hidden ">
      {/* Background Graphics */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-primary/8 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 right-10 w-56 h-56 bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-2 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-1 sm:p-6 shadow-lg border border-primary/10 mb-8">
          <div className="flex flex-col flex-wrap sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg">
                <Newspaper className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent pt-2">
                {showFull ? 'Latest News & Updates' : 'Latest News'}
              </h1>
            </div>
            {!showFull && news.length > 0 && (
              <button
                onClick={() => navigate('/news')}
                className="bg-gradient-to-r from-primary to-primary/80 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 text-center"
              >
                View All
                <ExternalLink className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filters - Only show in full mode */}
        {showFull && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-6 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search news..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/30 outline-none ${isSearching ? 'bg-gray-50' : ''}`}
                />
              </div>

              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className="w-full pl-3 pr-8 py-2 bg-white/80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 appearance-none"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.category} value={cat.category}>
                      {cat.category} ({cat.count})
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>
        )}

        {/* News List */}
        {news.length > 0 ? (
          <div className={`grid gap-6 ${'grid-cols-1'}`}>
            {news.map((item) => (
              <NewsCard key={item.id} item={item} compact={!showFull} />
            ))}
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Newspaper className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No News Available
            </h3>
            <p className="text-gray-500">
              {debouncedSearchTerm || selectedCategory !== 'all'
                ? 'No news found matching your criteria'
                : 'There are no news updates at the moment'}
            </p>
          </div>
        )}

        {/* Pagination - Only show in full mode */}
        {showFull && pagination && pagination.total > 1 && (
          <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Showing {(pagination.current - 1) * 10 + 1} to{' '}
                {Math.min(pagination.current * 10, pagination.totalItems)} of{' '}
                {pagination.totalItems} news
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={!pagination.hasPrev}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white/80 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <span className="px-4 py-2 text-sm text-gray-700">
                  Page {pagination.current} of {pagination.total}
                </span>

                <button
                  onClick={handleNextPage}
                  disabled={!pagination.hasNext}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white/80 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(LatestNews);
