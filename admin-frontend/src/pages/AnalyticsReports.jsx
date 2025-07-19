import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, FileText, Clock, CheckCircle, Calendar, Download } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';

const AnalyticsReports = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30days');
  const [analytics, setAnalytics] = useState({
    summary: {
      totalUsers: 0,
      totalMLAs: 0,
      totalMembers: 0,
      totalIssues: 0,
      resolvedIssues: 0,
      pendingIssues: 0,
      totalSessions: 0,
      averageResolutionTime: 0
    },
    newsByCategory: [],
    issuesByStatus: [],
    issuesByMonth: [],
    mlaPerformance: [],
    userGrowth: [],
    responseTimeMetrics: []
  });

  const COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#6B7280'];

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/analytics?range=${dateRange}`);
      const apiData = response.data?.data || {};
      
      // Map API response to expected format
      const totalUsers = (apiData.userGrowth || []).reduce((sum, item) => sum + (item._count?._all || 0), 0);
      const totalMLAs = (apiData.userGrowth || []).find(item => item.role === 'MLA')?._count?._all || 0;
      const totalMembers = (apiData.userGrowth || []).find(item => item.role === 'MEMBER')?._count?._all || 0;
      const totalIssues = (apiData.issueStats || []).reduce((sum, item) => sum + (item._count?._all || 0), 0);
      const resolvedIssues = apiData.resolvedIssuesCount || 0;
      const pendingIssues = (apiData.issueStats || []).find(item => item.status === 'PENDING')?._count?._all || 0;
      
      setAnalytics({
        summary: {
          totalUsers,
          totalMLAs,
          totalMembers,
          totalIssues,
          resolvedIssues,
          pendingIssues,
          totalSessions: 0,
          averageResolutionTime: apiData.responseTimeMetrics?.average || 0
        },
        newsByCategory: (apiData.newsStats || []).map(item => ({
          category: item.category || 'Unknown',
          count: item._count?._all || 0
        })),
        issuesByStatus: (apiData.issueStats || []).map(item => ({
          name: item.status || 'Unknown',
          count: item._count?._all || 0
        })),
        issuesByMonth: apiData.issuesByMonth || [],
        mlaPerformance: apiData.mlaPerformance || [],
        userGrowth: (apiData.userGrowth || []).map(item => ({
          month: item.role || 'Unknown',
          users: item._count?._all || 0
        })),
        responseTimeMetrics: {
          fastest: apiData.responseTimeMetrics?.fastest || 0,
          slowest: apiData.responseTimeMetrics?.slowest || 0,
          average: apiData.responseTimeMetrics?.average || 0
        }
      });
    } catch (error) {
      toast.error('Failed to fetch analytics data');
      console.error('Error fetching analytics:', error);
      // Set default values on error
      setAnalytics({
        summary: {
          totalUsers: 0,
          totalMLAs: 0,
          totalMembers: 0,
          totalIssues: 0,
          resolvedIssues: 0,
          pendingIssues: 0,
          totalSessions: 0,
          averageResolutionTime: 0
        },
        newsByCategory: [],
        issuesByStatus: [],
        issuesByMonth: [],
        mlaPerformance: [],
        userGrowth: [],
        responseTimeMetrics: {}
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, fetchAnalytics]);

  const exportReport = async (format) => {
    try {
      const response = await api.get(`/admin/analytics/export?format=${format}&range=${dateRange}`);
      const blob = new Blob([response.data], { 
        type: format === 'pdf' ? 'application/pdf' : 'text/csv' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${dateRange}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export report');
      console.error('Error exporting report:', error);
    }
  };

  const StatCard = ({ title, value, subtitle, color, trend, icon: Icon }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value || 0}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className="h-4 w-4 mr-1" />
              {trend.value}% from last period
            </div>
          )}
        </div>
        {Icon && <Icon className="h-8 w-8" style={{ color }} />}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Loader/>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
            <option value="1year">Last year</option>
          </select>
          <button
            onClick={() => exportReport('csv')}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => exportReport('pdf')}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={analytics.summary?.totalUsers || 0}
          icon={Users}
          color="#3B82F6"
          trend={{ positive: true, value: 12 }}
        />
        <StatCard
          title="Total Issues"
          value={analytics.summary?.totalIssues || 0}
          icon={FileText}
          color="#EF4444"
          subtitle={`${analytics.summary?.resolvedIssues || 0} resolved`}
        />
        <StatCard
          title="Pending Issues"
          value={analytics.summary?.pendingIssues || 0}
          icon={Clock}
          color="#F59E0B"
          trend={{ positive: false, value: 8 }}
        />
        <StatCard
          title="Resolution Rate"
          value={`${Math.round(((analytics.summary?.resolvedIssues || 0) / (analytics.summary?.totalIssues || 1)) * 100)}%`}
          icon={CheckCircle}
          color="#10B981"
          trend={{ positive: true, value: 5 }}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Issues by Category */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">News by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.newsByCategory || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Issues by Status */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Issues by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.issuesByStatus || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {(analytics.issuesByStatus || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Issues Over Time */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Issues Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.issuesByMonth || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.userGrowth || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MLA Performance Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">MLA Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MLA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Constituency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Issues
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resolved
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resolution Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Response Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(analytics.mlaPerformance || []).length > 0 ? (
                analytics.mlaPerformance.map((mla, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{mla.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mla.constituency || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mla.totalIssues || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mla.resolvedIssues || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        parseFloat(mla.resolutionRate) >= 80 
                          ? 'bg-green-100 text-green-800'
                          : parseFloat(mla.resolutionRate) >= 60
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {mla.resolutionRate || '0%'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mla.avgResponseTime || 0} hrs</div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No MLA performance data available for the selected time period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Response Time Metrics */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {analytics.summary?.averageResolutionTime || 0}
            </div>
            <div className="text-sm text-gray-600">Hours</div>
            <div className="text-xs text-gray-500">Average Resolution Time</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {analytics.responseTimeMetrics?.fastest || 0}
            </div>
            <div className="text-sm text-gray-600">Hours</div>
            <div className="text-xs text-gray-500">Fastest Resolution</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {analytics.responseTimeMetrics?.slowest || 0}
            </div>
            <div className="text-sm text-gray-600">Hours</div>
            <div className="text-xs text-gray-500">Slowest Resolution</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsReports;
