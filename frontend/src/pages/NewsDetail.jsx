import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, MapPin, Eye, Share2 } from 'lucide-react';
import '../styles/rich-content.css';

const NewsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [news, setNews] = useState(null);
  const [similarNews, setSimilarNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const fetchSimilarNews = useCallback(
    async (currentNews) => {
      try {
        // Build query parameters for similar news
        const params = new URLSearchParams({
          limit: '4', // Get 4 similar articles
          ...(currentNews.category && { category: currentNews.category }),
          ...(currentNews.stateId && { state: currentNews.stateId }),
        });

        const response = await fetch(`${apiUrl}/news?${params}`);
        const result = await response.json();

        if (result.success && result.data.news) {
          // Filter out the current article and limit to 3 items
          const filtered = result.data.news
            .filter((item) => item.id !== currentNews.id)
            .slice(0, 3);
          setSimilarNews(filtered);
        }
      } catch (err) {
        console.error('Error fetching similar news:', err);
        // Don't show error for similar news, just leave it empty
      }
    },
    [apiUrl]
  );

  useEffect(() => {
    const fetchNewsDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiUrl}/news/${id}`);
        const result = await response.json();

        if (result.success) {
          setNews(result.data);
          // Fetch similar news after getting the main article
          await fetchSimilarNews(result.data);
        } else {
          setError(result.message || 'Failed to fetch news');
        }
      } catch (err) {
        console.error('Error fetching news detail:', err);
        setError('Failed to load news article');
      } finally {
        setLoading(false);
      }
    };

    fetchNewsDetail();
  }, [id, apiUrl, fetchSimilarNews]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: news.title,
          text: news.summary,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      breaking: 'bg-red-100 text-red-800',
      politics: 'bg-blue-100 text-blue-800',
      governance: 'bg-green-100 text-green-800',
      development: 'bg-purple-100 text-purple-800',
      alerts: 'bg-yellow-100 text-yellow-800',
      general: 'bg-gray-100 text-gray-800',
    };
    return colors[category?.toLowerCase()] || colors.general;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button
            onClick={() => navigate('/news')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Back to News
          </button>
        </div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Article Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The news article you're looking for doesn't exist or has been
            removed.
          </p>
          <button
            onClick={() => navigate('/news')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Back to News
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/news')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to News
        </button>

        {/* Article Header */}
        <article className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Article Meta */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(news.category)}`}
              >
                {news.category || 'General'}
              </span>

              {news.isPinned && (
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                  📌 Pinned
                </span>
              )}

              {news.isNational && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  🌍 National
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
              {news.title}
            </h1>

            {news.featuredImage && (
              <div className="mb-6">
                <img
                  src={news.featuredImage}
                  alt={news.title}
                  className="w-full h-64 md:h-80 object-cover rounded-lg shadow-lg"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}

            {news.summary && (
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                {news.summary}
              </p>
            )}

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(news.publishedAt)}</span>
              </div>

              {news.state && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{news.state.name}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{news.viewCount || 0} views</span>
              </div>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
          </div>

          {/* Article Content */}
          <div className="p-6">
            <div
              className="rich-content"
              dangerouslySetInnerHTML={{ __html: news.content }}
            />

            {/* Tags */}
            {news.tags && news.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-3">
                  Tags:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {news.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {news.attachments && news.attachments.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-3">
                  Attachments:
                </h3>
                <div className="space-y-2">
                  {news.attachments.map((attachment, index) => (
                    <a
                      key={index}
                      href={attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors text-sm"
                    >
                      <span className="w-4 h-4">📎</span>
                      Attachment {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Similar News Section */}
        {similarNews.length > 0 && (
          <section className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Similar News
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {similarNews.map((item) => (
                <article
                  key={item.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
                  onClick={() => navigate(`/news/${item.id}`)}
                >
                  {/* Featured Image */}
                  {item.featuredImage && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={item.featuredImage}
                        alt={item.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div className="p-4">
                    {/* Category and Meta */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}
                      >
                        {item.category || 'General'}
                      </span>
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(item.publishedAt).split(',')[0]}{' '}
                        {/* Just the date */}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">
                      {item.title}
                    </h3>

                    {/* Summary */}
                    {item.summary && (
                      <p className="text-gray-600 text-xs line-clamp-2 mb-3">
                        {item.summary}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-3">
                        {item.state && (
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span>{item.state.name}</span>
                          </div>
                        )}
                        {item.isNational && (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                            National
                          </span>
                        )}
                      </div>

                      {item.viewCount > 0 && (
                        <div className="flex items-center">
                          <Eye className="w-3 h-3 mr-1" />
                          <span>{item.viewCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default NewsDetail;
