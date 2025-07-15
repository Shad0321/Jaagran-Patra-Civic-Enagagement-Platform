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
  MapPin,
  Filter,
  Download,
  RefreshCw,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AnalyticsReport = () => {
  const { user } = useSelector((state) => state.user);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('30'); // days
  const [refreshing, setRefreshing] = useState(false);

  // Fetch analytics data
  const fetchAnalyticsData = async (days = '30') => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`/analytics/mla-report?days=${days}`);
      
      if (response.data.success) {
        setAnalyticsData(response.data.analytics);
        console.log('Analytics data fetched successfully:', response.data.analytics);
      } else {
        throw new Error('Failed to fetch analytics data');
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      
      // Check if it's a real API error or if we should show mock data
      if (err.response?.status === 404) {
        setError('MLA profile not found. Please contact administrator.');
        return;
      }
      
      if (err.response?.status === 403) {
        setError('Access denied. This page is only available to MLAs.');
        return;
      }
      
      // For other errors, use mock data for development/testing
      const mockData = {
        overview: {
          totalIssues: 156,
          resolvedIssues: 89,
          pendingIssues: 45,
          activeMembers: 12,
          totalMembers: 15,
          resolutionRate: 57,
          avgResolutionTime: 8,
          issueGrowth: 12,
        },
        charts: {
          statusDistribution: [
            { name: 'Resolved', value: 89 },
            { name: 'Pending', value: 45 },
            { name: 'In Progress', value: 20 },
            { name: 'Rejected', value: 2 },
          ],
          priorityDistribution: [
            { priority: 'LOW', count: 45 },
            { priority: 'MEDIUM', count: 67 },
            { priority: 'HIGH', count: 32 },
            { priority: 'URGENT', count: 12 },
          ],
          issueTrends: [
            { date: 'Nov 15', created: 5, resolved: 3 },
            { date: 'Nov 16', created: 8, resolved: 5 },
            { date: 'Nov 17', created: 3, resolved: 7 },
            { date: 'Nov 18', created: 12, resolved: 4 },
            { date: 'Nov 19', created: 6, resolved: 8 },
            { date: 'Nov 20', created: 9, resolved: 6 },
            { date: 'Nov 21', created: 7, resolved: 5 },
          ],
          memberPerformance: [
            { name: 'John Doe', resolved: 15, pending: 3 },
            { name: 'Jane Smith', resolved: 12, pending: 5 },
            { name: 'Bob Wilson', resolved: 18, pending: 2 },
            { name: 'Alice Johnson', resolved: 8, pending: 7 },
          ],
          categoryTrends: [
            { date: 'Jul 11', roads: 0, electricity: 0, water_supply: 1, infrastructure: 0, health: 0 },
            { date: 'Jul 12', roads: 0, electricity: 0, water_supply: 1, infrastructure: 1, health: 0 },
            { date: 'Jul 13', roads: 1, electricity: 1, water_supply: 1, infrastructure: 0, health: 0 },
            { date: 'Jul 14', roads: 0, electricity: 0, water_supply: 0, infrastructure: 0, health: 1 },
            { date: 'Jul 15', roads: 0, electricity: 0, water_supply: 0, infrastructure: 0, health: 0 },
          ],
        },
        tables: {
          topMembers: [
            { id: 1, name: 'Bob Wilson', email: 'bob@example.com', resolvedCount: 18, avgResolutionTime: 6, rating: 85 },
            { id: 2, name: 'John Doe', email: 'john@example.com', resolvedCount: 15, avgResolutionTime: 7, rating: 78 },
            { id: 3, name: 'Jane Smith', email: 'jane@example.com', resolvedCount: 12, avgResolutionTime: 9, rating: 70 },
            { id: 4, name: 'Alice Johnson', email: 'alice@example.com', resolvedCount: 8, avgResolutionTime: 12, rating: 55 },
          ],
        },
        activities: [
          { type: 'resolved', title: 'Road Repair Issue Resolved', description: 'Resolved by John Doe', time: '2 hours ago' },
          { type: 'created', title: 'New Water Supply Issue', description: 'Created by Alice Johnson', time: '4 hours ago' },
          { type: 'resolved', title: 'Street Light Issue Fixed', description: 'Resolved by Bob Wilson', time: '6 hours ago' },
          { type: 'created', title: 'Garbage Collection Issue', description: 'Created by Jane Smith', time: '8 hours ago' },
        ],
      };
      
      setAnalyticsData(mockData);
      setError('Using sample data - API endpoint not available');
      console.log('Using mock data for analytics');
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData(dateRange);
    setRefreshing(false);
    toast.success('Analytics data refreshed');
  };

  // Handle date range change
  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
    fetchAnalyticsData(newRange);
  };

  // Export report
  const handleExportReport = async () => {
    try {
      const response = await api.get(`/analytics/mla-report/export?days=${dateRange}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `mla-analytics-report-${dateRange}days.pdf`);
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

  const PIE_COLORS = [COLORS.success, COLORS.warning, COLORS.danger, COLORS.info];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error && !analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Analytics</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchAnalyticsData()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show warning if using mock data
  const showMockWarning = error && analyticsData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mock Data Warning */}
        {showMockWarning && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Using Sample Data</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  The analytics API is not available. Displaying sample data for demonstration purposes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Activity className="mr-3 h-8 w-8 text-blue-600" />
                Analytics Report
              </h1>
              <p className="mt-2 text-gray-600">
                Performance overview for {user.name} - {user.mlaProfile?.constituency || 'Your Constituency'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Date Range Filter */}
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <select
                  value={dateRange}
                  onChange={(e) => handleDateRangeChange(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 3 months</option>
                  <option value="180">Last 6 months</option>
                  <option value="365">Last year</option>
                </select>
              </div>
              
              {/* Action Buttons */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button
                onClick={handleExportReport}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Issues</p>
                <p className="text-3xl font-bold text-gray-900">{analyticsData?.overview?.totalIssues || 0}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+{analyticsData?.overview?.issueGrowth || 0}%</span>
              <span className="text-sm text-gray-500 ml-1">from last period</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved Issues</p>
                <p className="text-3xl font-bold text-green-600">{analyticsData?.overview?.resolvedIssues || 0}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-gray-600">
                {analyticsData?.overview?.resolutionRate || 0}% resolution rate
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Issues</p>
                <p className="text-3xl font-bold text-yellow-600">{analyticsData?.overview?.pendingIssues || 0}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-gray-600">
                Avg. {analyticsData?.overview?.avgResolutionTime || 0} days to resolve
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Members</p>
                <p className="text-3xl font-bold text-purple-600">{analyticsData?.overview?.activeMembers || 0}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-gray-600">
                {analyticsData?.overview?.totalMembers || 0} total members
              </span>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Issue Status Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Issue Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData?.charts?.statusDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(analyticsData?.charts?.statusDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Issue Trends */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Issue Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData?.charts?.issueTrends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="created" stroke={COLORS.primary} strokeWidth={2} />
                <Line type="monotone" dataKey="resolved" stroke={COLORS.success} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Priority Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Issues by Priority</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData?.charts?.priorityDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="priority" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Member Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Member Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData?.charts?.memberPerformance || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="resolved" fill={COLORS.success} />
                <Bar dataKey="pending" fill={COLORS.warning} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Issues by Category</h3>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={analyticsData?.charts?.categoryTrends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {/* Dynamically render areas based on available categories */}
              {analyticsData?.charts?.categoryTrends && analyticsData.charts.categoryTrends.length > 0 && 
                Object.keys(analyticsData.charts.categoryTrends[0])
                  .filter(key => key !== 'date')
                  .map((category, index) => {
                    const colorKeys = Object.keys(COLORS);
                    const color = COLORS[colorKeys[index % colorKeys.length]];
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
                  })
              }
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Performing Members */}
          <div className="bg-white rounded-lg shadow">
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
                  {(analyticsData?.tables?.topMembers || []).map((member, index) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">{index + 1}</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{member.name}</div>
                            <div className="text-sm text-gray-500">{member.email}</div>
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
                          <span className="ml-2 text-sm text-gray-600">{member.rating}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Activity className="mr-2 h-5 w-5 text-blue-500" />
                Recent Activities
              </h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                {(analyticsData?.activities || []).map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                      activity.type === 'resolved' ? 'bg-green-100' :
                      activity.type === 'created' ? 'bg-blue-100' :
                      'bg-yellow-100'
                    }`}>
                      {activity.type === 'resolved' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : activity.type === 'created' ? (
                        <FileText className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsReport;
