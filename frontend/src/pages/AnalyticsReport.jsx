import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Target,
  Award,
  Activity,
  FileText,
  Download,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import api from '../utils/api';
import { toast } from 'react-toastify';
import Loader from '../components/common/Loader';

const AnalyticsReport = () => {
  const { user } = useSelector((state) => state.user);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('30');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalyticsData = async (days = '30') => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/analytics/mla-report?days=${days}`);

      if (response.data.success) {
        setAnalyticsData(response.data.analytics);
      } else {
        throw new Error('Failed to fetch analytics data');
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      if (err.response?.status === 404) {
        setError('MLA profile not found. Please contact administrator.');
      } else if (err.response?.status === 403) {
        setError('Access denied. This page is only available to MLAs.');
      } else {
        setError('Failed to load analytics data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData(dateRange);
    setRefreshing(false);
    toast.success('Analytics data refreshed');
  };

  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
    fetchAnalyticsData(newRange);
  };

  const handleExportReport = async () => {
    try {
      const response = await api.get(
        `/analytics/mla-report/export?days=${dateRange}`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `mla-analytics-report-${dateRange}days.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report exported successfully');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export report');
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Color schemes for charts
  const COLORS = {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#06B6D4',
    purple: '#8B5CF6',
    pink: '#EC4899',
  };

  const PIE_COLORS = [
    COLORS.success,
    COLORS.warning,
    COLORS.danger,
    COLORS.info,
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-slate-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error Loading Analytics
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => fetchAnalyticsData()}
            className="bg-gradient-to-r from-primary to-primary/80 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all duration-200 inline-flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-slate-50 to-primary/10 relative overflow-hidden">
      {/* Background Graphics */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-primary/8 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 right-10 w-56 h-56 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.05)_1px,transparent_0)] bg-[size:20px_20px]"></div>
      </div>

      <div className="relative z-10 p-2 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-primary/10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2 flex items-center pt-2">
                  <Activity className="mr-3 h-8 w-8 text-primary" />
                  Analytics Report
                </h1>
                <p className="text-gray-600">
                  Performance overview for {user?.name} -{' '}
                  {user?.mlaProfile?.constituency || 'Your Constituency'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Date Range Filter */}
                <div className="relative">
                  <select
                    value={dateRange}
                    onChange={(e) => handleDateRangeChange(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 bg-white/80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 appearance-none"
                  >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 3 months</option>
                    <option value="180">Last 6 months</option>
                    <option value="365">Last year</option>
                  </select>
                  <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>

                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="px-4 py-2 bg-white/80 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </button>

                <button
                  onClick={handleExportReport}
                  className="bg-gradient-to-r from-primary to-primary/80 text-white px-4 py-2 rounded-lg hover:shadow-md transition-all duration-200 flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export Report
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        {analyticsData?.overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Issues
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {analyticsData.overview.totalIssues || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">
                  +{analyticsData.overview.issueGrowth || 0}%
                </span>
                <span className="text-sm text-gray-500 ml-1">
                  from last period
                </span>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-emerald-200/50 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Resolved Issues
                  </p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {analyticsData.overview.resolvedIssues || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-gray-600">
                  {analyticsData.overview.resolutionRate || 0}% resolution rate
                </span>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-yellow-200/50 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Pending Issues
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {analyticsData.overview.pendingIssues || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center shadow-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-gray-600">
                  Avg. {analyticsData.overview.avgResolutionTime || 0} days to
                  resolve
                </span>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-purple-200/50 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Active Members
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {analyticsData.overview.activeMembers || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-gray-600">
                  {analyticsData.overview.totalMembers || 0} total members
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Charts Grid */}
        {analyticsData?.charts && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Issue Status Distribution */}
              {analyticsData.charts.statusDistribution && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Issue Status Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData.charts.statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analyticsData.charts.statusDistribution.map(
                          (entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          )
                        )}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Issue Trends */}
              {analyticsData.charts.issueTrends && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Issue Trends
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData.charts.issueTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="created"
                        stroke={COLORS.primary}
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="resolved"
                        stroke={COLORS.success}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Additional Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Priority Distribution */}
              {analyticsData.charts.priorityDistribution && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Issues by Priority
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.charts.priorityDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="priority" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill={COLORS.primary} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Member Performance */}
              {analyticsData.charts.memberPerformance && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Member Performance
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.charts.memberPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="resolved" fill={COLORS.success} />
                      <Bar dataKey="pending" fill={COLORS.warning} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Category Performance */}
            {analyticsData.charts.categoryTrends && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-6 mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Issues by Category
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={analyticsData.charts.categoryTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {analyticsData.charts.categoryTrends.length > 0 &&
                      Object.keys(analyticsData.charts.categoryTrends[0])
                        .filter((key) => key !== 'date')
                        .map((category, index) => {
                          const colorKeys = Object.keys(COLORS);
                          const color =
                            COLORS[colorKeys[index % colorKeys.length]];
                          return (
                            <Area
                              key={category}
                              type="monotone"
                              dataKey={category}
                              stackId="1"
                              stroke={color}
                              fill={color}
                              name={category.toUpperCase().replace('_', ' ')}
                            />
                          );
                        })}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}

        {/* Performance Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Performing Members */}
          {analyticsData?.tables?.topMembers && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Award className="mr-2 h-5 w-5 text-yellow-500" />
                  Top Performing Members
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resolved
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg. Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analyticsData.tables.topMembers.map((member, index) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {index + 1}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {member.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {member.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.resolvedCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.avgResolutionTime} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-2 w-16 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${member.rating}%` }}
                              />
                            </div>
                            <span className="ml-2 text-sm text-gray-600">
                              {member.rating}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Activities */}
          {analyticsData?.activities && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Activity className="mr-2 h-5 w-5 text-blue-500" />
                  Recent Activities
                </h3>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-4">
                  {analyticsData.activities.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div
                        className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                          activity.type === 'resolved'
                            ? 'bg-green-100'
                            : activity.type === 'created'
                              ? 'bg-blue-100'
                              : 'bg-yellow-100'
                        }`}
                      >
                        {activity.type === 'resolved' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : activity.type === 'created' ? (
                          <FileText className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsReport;
