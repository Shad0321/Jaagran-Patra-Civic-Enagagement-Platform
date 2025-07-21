import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import {
  MapPin,
  TrendingUp,
  Users,
  Award,
  Info,
  BarChart3,
  PieChart,
  Activity,
  Filter,
  Search,
  ChevronRight,
  Home,
  ArrowLeft,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
} from 'recharts';
import LatestNews from '../components/LatestNews';
import 'leaflet/dist/leaflet.css';

// Import custom marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import Loader from '../components/common/Loader';

// Custom icons for different types of markers
const defaultIcon = new Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Use primary color shades for icons
const stateIcon = new Icon({
  iconUrl:
    'data:image/svg+xml;base64,' +
    btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#22c55e" width="30" height="30">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `),
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

const assemblyIcon = new Icon({
  iconUrl:
    'data:image/svg+xml;base64,' +
    btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#16a34a" width="25" height="25">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `),
  iconSize: [25, 25],
  iconAnchor: [12, 25],
  popupAnchor: [0, -25],
});

const pollingBoothIcon = new Icon({
  iconUrl:
    'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#a3e635" width="20" height="20">
      <circle cx="12" cy="9" r="2" fill="#FFFFFF"/>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `),
  iconSize: [20, 20],
  iconAnchor: [10, 20],
  popupAnchor: [0, -20],
});

// Component to update map view
const MapViewUpdater = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);

  return null;
};

// Colors for charts (primary and related shades)
const COLORS = [
  '#22c55e', // primary
  '#16a34a', // primary-dark
  '#a3e635', // primary-light
  '#3B82F6',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#F97316',
];

// Component for election result comparison
const ElectionResultCard = ({ year, data, isWinner = false }) => (
  <div
    className={`p-4 rounded-xl border-2 transition-all duration-300 ${isWinner ? 'border-primary bg-primary/10 shadow-lg' : 'border-gray-200 bg-white hover:shadow-md'}`}
  >
    <div className="flex justify-between items-center mb-3">
      <h4 className="font-semibold text-lg text-primary">{year}</h4>
      {isWinner && <Award className="w-5 h-5 text-primary" />}
    </div>
    <div className="space-y-3">
      <div
        className={`p-3 rounded-lg ${isWinner ? 'bg-primary/10 border border-primary/20' : 'bg-gray-50'}`}
      >
        <div className="font-medium text-primary">
          Winner: {data.winner.candidate}
        </div>
        <div className="text-sm text-gray-600 mt-1">
          {data.winner.party} • {data.winner.votes.toLocaleString()} votes (
          {data.winner.percentage}%)
        </div>
      </div>
      <div className="p-3 rounded-lg bg-gray-50">
        <div className="font-medium text-primary-dark">
          Runner-up: {data.runnerUp.candidate}
        </div>
        <div className="text-sm text-gray-600 mt-1">
          {data.runnerUp.party} • {data.runnerUp.votes.toLocaleString()} votes (
          {data.runnerUp.percentage}%)
        </div>
      </div>
      <div className="text-center text-sm font-medium text-primary bg-primary/10 py-2 rounded-lg">
        Margin: {data.margin.toLocaleString()} votes
      </div>
    </div>
  </div>
);

// Statistics Card Component
const StatCard = ({ title, value, icon: IconComponent , change }) => (
  <div className="bg-white rounded-xl shadow-sm border border-primary/20 p-6 hover:shadow-lg transition-shadow duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {change && (
          <p
            className={`text-sm mt-1 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {change > 0 ? '+' : ''}
            {change}% from last election
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg bg-primary`}>
        <IconComponent className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

// Breadcrumb Component
const Breadcrumb = ({
  mapLevel,
  selectedState,
  selectedAssembly,
  selectedPollingBooth,
  onNavigate,
}) => {
  const items = [
    { label: 'India', level: 'india', active: mapLevel === 'india' },
    ...(selectedState
      ? [
          {
            label: selectedState.name,
            level: 'state',
            active: mapLevel === 'state',
          },
        ]
      : []),
    ...(selectedAssembly
      ? [
          {
            label: selectedAssembly.name,
            level: 'assembly',
            active: mapLevel === 'assembly',
          },
        ]
      : []),
    ...(selectedPollingBooth
      ? [
          {
            label: selectedPollingBooth.name,
            level: 'polling',
            active: mapLevel === 'polling',
          },
        ]
      : []),
  ];

  return (
    <div className="flex items-center space-x-2 text-sm">
      <Home className="w-4 h-4 text-primary" />
      {items.map((item, index) => (
        <React.Fragment key={item.level}>
          <button
            onClick={() => onNavigate(item.level)}
            className={`hover:text-primary transition-colors ${
              item.active ? 'text-primary font-bold underline' : 'text-gray-500'
            }`}
          >
            {item.label}
          </button>
          {index < items.length - 1 && (
            <ChevronRight className="w-3 h-3 text-primary" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const InteractiveElectionMap = () => {
  const [mapLevel, setMapLevel] = useState('india');
  const [selectedState, setSelectedState] = useState(null);
  const [selectedAssembly, setSelectedAssembly] = useState(null);
  const [selectedPollingBooth, setSelectedPollingBooth] = useState(null);
  const [mapData, setMapData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const [mapZoom, setMapZoom] = useState(5);
  const [selectedYear, setSelectedYear] = useState('2024');
  const [boothDetails, setBoothDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [allStatesData, setAllStatesData] = useState([]); // Store all states for reference

  // Sample data for charts (you would replace this with real data)
  const generateChartData = () => {
    const dataSource = mapLevel === 'india' ? allStatesData : mapData;
    if (!dataSource.length) return [];

    // Generate party vote share data
    const partyData = {};
    dataSource.forEach((item) => {
      if (item.electionData?.Party_Votes_Assembly_Aggregated) {
        Object.entries(
          item.electionData.Party_Votes_Assembly_Aggregated
        ).forEach(([party, votes]) => {
          partyData[party] = (partyData[party] || 0) + votes;
        });
      }
    });

    return Object.entries(partyData)
      .map(([party, votes]) => ({
        name: party,
        votes: votes,
        percentage: (
          (votes / Object.values(partyData).reduce((a, b) => a + b, 0)) *
          100
        ).toFixed(1),
      }))
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 8);
  };

  const chartData = generateChartData();

  // Fetch functions (keeping all original functionality)
  const fetchStates = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/map/states`
      );
      const data = await response.json();
      if (data.success) {
        setAllStatesData(data.data); // Store all states
        setMapData(data.data); // Show all states initially
      }
    } catch (error) {
      console.error('Error fetching states:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssemblies = async (stateId) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/map/states/${stateId}/assemblies?year=${selectedYear}`
      );
      const data = await response.json();
      if (data.success) {
        setMapData(data.data.assemblies);
      }
    } catch (error) {
      console.error('Error fetching assemblies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPollingBooths = async (constituencyId) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/map/assemblies/${constituencyId}/polling-booths?year=${selectedYear}`
      );
      const data = await response.json();
      if (data.success) {
        setMapData(data.data.pollingBooths);
      }
    } catch (error) {
      console.error('Error fetching polling booths:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPollingBoothDetails = async (constituencyId, boothName) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/map/assemblies/${constituencyId}/polling-booths/${encodeURIComponent(boothName)}?years=2024,2022`
      );
      const data = await response.json();
      if (data.success) {
        setBoothDetails(data.data);
      }
    } catch (error) {
      console.error('Error fetching polling booth details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStates();
  }, []);

  const handleStateClick = (state) => {
    setSelectedState(state);
    setMapLevel('state');
    setMapCenter([state.latitude || 20.5937, state.longitude || 78.9629]);
    setMapZoom(7);

    // Hide other states - show only the selected state on map
    setMapData([state]);

    // Fetch assemblies for the selected state
    fetchAssemblies(state.id);
  };

  const handleAssemblyClick = (assembly) => {
    setSelectedAssembly(assembly);
    setMapLevel('assembly');
    setMapCenter([assembly.latitude || 20.5937, assembly.longitude || 78.9629]);
    setMapZoom(10);
    fetchPollingBooths(assembly.id);
  };

  const handlePollingBoothClick = (booth) => {
    setSelectedPollingBooth(booth);
    setMapLevel('polling');
    setMapCenter([booth.latitude, booth.longitude]);
    setMapZoom(12);
    fetchPollingBoothDetails(booth.constituencyId, booth.name);
  };

  const handleBreadcrumbNavigation = (level) => {
    switch (level) {
      case 'india':
        setMapLevel('india');
        setSelectedState(null);
        setSelectedAssembly(null);
        setSelectedPollingBooth(null);
        setBoothDetails(null);
        setMapCenter([20.5937, 78.9629]);
        setMapZoom(5);
        // Restore all states when going back to India level
        setMapData(allStatesData);
        break;
      case 'state':
        if (selectedState) {
          setMapLevel('state');
          setSelectedAssembly(null);
          setSelectedPollingBooth(null);
          setBoothDetails(null);
          setMapCenter([selectedState.latitude, selectedState.longitude]);
          setMapZoom(7);
          // Show only the selected state
          setMapData([selectedState]);
          fetchAssemblies(selectedState.id);
        }
        break;
      case 'assembly':
        if (selectedAssembly) {
          setMapLevel('assembly');
          setSelectedPollingBooth(null);
          setBoothDetails(null);
          setMapCenter([selectedAssembly.latitude, selectedAssembly.longitude]);
          setMapZoom(10);
          fetchPollingBooths(selectedAssembly.id);
        }
        break;
    }
  };

  const goBack = () => {
    if (mapLevel === 'polling') {
      handleBreadcrumbNavigation('assembly');
    } else if (mapLevel === 'assembly') {
      handleBreadcrumbNavigation('state');
    } else if (mapLevel === 'state') {
      handleBreadcrumbNavigation('india');
    }
  };

  const getMarkerIcon = () => {
    switch (mapLevel) {
      case 'india':
        return stateIcon;
      case 'state':
        return assemblyIcon;
      case 'assembly':
        return pollingBoothIcon;
      default:
        return defaultIcon;
    }
  };

  const getMarkerClickHandler = (item) => {
    switch (mapLevel) {
      case 'india':
        return () => handleStateClick(item);
      case 'state':
        return () => handleAssemblyClick(item);
      case 'assembly':
        return () => handlePollingBoothClick(item);
      default:
        return () => {};
    }
  };

  const filteredMapData = mapData.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get appropriate data source for statistics based on current level
  const getStatsData = () => {
    if (mapLevel === 'india') {
      return allStatesData; // Use all states for India-level stats
    }
    return mapData; // Use current map data for other levels
  };

  const statsData = getStatsData();
  const totalVotes = statsData.reduce(
    (sum, item) => sum + (item.electionData?.Total_Votes_Constituency || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h1 className="text-xs sm:text-sm md:text-3xl font-bold text-gray-900">
                  Election Analytics Dashboard
                </h1>
                <div className="hidden md:block">
                  <Breadcrumb
                    mapLevel={mapLevel}
                    selectedState={selectedState}
                    selectedAssembly={selectedAssembly}
                    selectedPollingBooth={selectedPollingBooth}
                    onNavigate={handleBreadcrumbNavigation}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                >
                  <option value="2024">2024</option>
                  <option value="2022">2022</option>
                </select>

                {mapLevel !== 'india' && (
                  <button
                    onClick={goBack}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                )}
              </div>
            </div>

            {/* Search and Filter Bar */}
            {/* <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={`Search ${mapLevel === 'india' ? 'states' : mapLevel === 'state' ? 'assemblies' : 'polling booths'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div> */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Locations"
            value={mapData.length.toLocaleString()}
            icon={MapPin}
            color="bg-blue-500"
          />
          <StatCard
            title="Total Votes"
            value={totalVotes.toLocaleString()}
            icon={Users}
            color="bg-green-500"
          />
          <StatCard
            title="Data Coverage"
            value={`${Math.round((statsData.filter((item) => item.electionData || item.electionResults).length / Math.max(statsData.length, 1)) * 100)}%`}
            icon={Activity}
            color="bg-purple-500"
          />
          <StatCard
            title="Year"
            value={selectedYear}
            icon={TrendingUp}
            color="bg-orange-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Enhanced Map Container - MODIFIED FOR STICKY POSITION */}
      <div className="lg:col-span-2 lg:sticky lg:top-6 lg:self-start">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Map Tabs */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex space-x-6">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'overview'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Map Overview
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'analytics'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Analytics
                </button>
              </div>

              {/* View Mode Indicator */}
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                {mapLevel === 'india' && (
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                    Showing all {allStatesData.length} states
                  </span>
                )}
                {mapLevel === 'state' && selectedState && (
                  <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full">
                    Focused on {selectedState.name}
                  </span>
                )}
                {mapLevel === 'assembly' && selectedAssembly && (
                  <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded-full">
                    Assembly: {selectedAssembly.name}
                  </span>
                )}
                {mapLevel === 'polling' && selectedPollingBooth && (
                  <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full">
                    Booth: {selectedPollingBooth.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {activeTab === 'overview' && (
            <div className="h-96 lg:h-[600px]">
              {loading ? (
                <Loader/>
              ) : (
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  style={{ height: '100%', width: '100%' }}
                  className="z-0"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <MapViewUpdater center={mapCenter} zoom={mapZoom} />

                  {filteredMapData.map(
                    (item, index) =>
                      item.latitude &&
                      item.longitude && (
                        <Marker
                          key={`${mapLevel}-${item.id || index}`} // Better key to handle level changes
                          position={[item.latitude, item.longitude]}
                          icon={getMarkerIcon()}
                          eventHandlers={{
                            click: getMarkerClickHandler(item),
                          }}
                        >
                          <Popup>
                            <div className="p-3 min-w-64">
                              <h3 className="font-semibold text-lg mb-2 flex items-center">
                                {item.name}
                                {mapLevel === 'state' &&
                                  selectedState &&
                                  selectedState.id === item.id && (
                                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                      Selected
                                    </span>
                                  )}
                              </h3>
                              {item.electionData && (
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="font-medium">
                                      Total Votes:
                                    </span>
                                    <span>
                                      {item.electionData.Total_Votes_Constituency?.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-medium">
                                      NOTA Votes:
                                    </span>
                                    <span>
                                      {item.electionData.NOTA_Votes_Constituency?.toLocaleString()}
                                    </span>
                                  </div>
                                  {item.electionData
                                    .Party_Votes_Assembly_Aggregated && (
                                    <div className="mt-3">
                                      <span className="font-medium">
                                        Top Parties:
                                      </span>
                                      <div className="mt-1 space-y-1">
                                        {Object.entries(
                                          item.electionData
                                            .Party_Votes_Assembly_Aggregated
                                        )
                                          .sort(([, a], [, b]) => b - a)
                                          .slice(0, 3)
                                          .map(([party, votes]) => (
                                            <div
                                              key={party}
                                              className="flex justify-between text-xs"
                                            >
                                              <span className="truncate">
                                                {party}:
                                              </span>
                                              <span className="ml-2">
                                                {votes.toLocaleString()}
                                              </span>
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              {item.electionResults && (
                                <div className="space-y-2 text-sm">
                                  <div className="p-2 bg-green-50 rounded">
                                    <div className="font-medium text-green-700">
                                      Winner:{' '}
                                      {
                                        item.electionResults.winner
                                          .candidate
                                      }
                                    </div>
                                    <div className="text-green-600">
                                      {item.electionResults.winner.party} •{' '}
                                      {item.electionResults.winner.votes.toLocaleString()}{' '}
                                      votes (
                                      {
                                        item.electionResults.winner
                                          .percentage
                                      }
                                      %)
                                    </div>
                                  </div>
                                  <div className="text-center text-sm font-medium text-blue-600">
                                    Margin:{' '}
                                    {item.electionResults.margin.toLocaleString()}{' '}
                                    votes
                                  </div>
                                </div>
                              )}
                            </div>
                          </Popup>
                        </Marker>
                      )
                  )}
                </MapContainer>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="p-6 h-96 lg:h-[600px] overflow-y-auto">
              <div className="space-y-6">
                {chartData.length > 0 && (
                  <>
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2" />
                        Party Vote Share
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="name"
                            angle={-45}
                            textAnchor="end"
                            height={100}
                          />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => [
                              value.toLocaleString(),
                              'Votes',
                            ]}
                          />
                          <Bar dataKey="votes" fill="#3B82F6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <PieChart className="w-5 h-5 mr-2" />
                        Vote Distribution
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percentage }) =>
                              `${name}: ${percentage}%`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="votes"
                          >
                            {chartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [
                              value.toLocaleString(),
                              'Votes',
                            ]}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}

                {chartData.length === 0 && (
                  <div className="text-center py-12">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-500">
                      No Analytics Data Available
                    </h3>
                    <p className="text-gray-400">
                      Select a Assembly to view analytics
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Sidebar */}
      <div className="space-y-6">
        {/* Current Location Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Info className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-lg">Current Location</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Level:</span>
              <span className="font-medium text-gray-900 capitalize">
                {mapLevel}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Year:</span>
              <span className="font-medium text-gray-900">
                {selectedYear}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Data Points:</span>
              <span className="font-medium text-gray-900">
                {mapData.length}
              </span>
            </div>
            {selectedState && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">State:</span>
                <span className="font-medium text-gray-900">
                  {selectedState.name}
                </span>
              </div>
            )}
            {selectedAssembly && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Assembly:</span>
                <span className="font-medium text-gray-900">
                  {selectedAssembly.name}
                </span>
              </div>
            )}
            {selectedPollingBooth && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Polling Booth:
                </span>
                <span className="font-medium text-gray-900">
                  {selectedPollingBooth.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-lg">Quick Stats</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {mapData.length}
              </div>
              <div className="text-sm text-gray-600">
                {mapLevel === 'india' && 'States'}
                {mapLevel === 'state' && 'Assemblies'}
                {mapLevel === 'assembly' && 'Polling Booths'}
                {mapLevel === 'polling' && 'Detail Views'}
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {
                  mapData.filter(
                    (item) => item.electionData || item.electionResults
                  ).length
                }
              </div>
              <div className="text-sm text-gray-600">With Data</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(
                  (mapData.filter(
                    (item) => item.electionData || item.electionResults
                  ).length /
                    mapData.length) *
                    100
                ) || 0}
                %
              </div>
              <div className="text-sm text-gray-600">Coverage</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {totalVotes > 0
                  ? (totalVotes / 1000000).toFixed(1) + 'M'
                  : '0'}
              </div>
              <div className="text-sm text-gray-600">Total Votes</div>
            </div>
          </div>
        </div>

        {/* Top Performers */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-lg">Top Performers</h3>
            </div>
            <div className="space-y-3">
              {chartData.slice(0, 5).map((party, index) => (
                <div
                  key={party.name}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full`}
                      style={{
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    ></div>
                    <span className="font-medium text-gray-900">
                      {party.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {party.percentage}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {party.votes.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Polling Booth Details */}
        {boothDetails && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Users className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-lg">Election Comparison</h3>
            </div>
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="font-medium text-gray-900">
                  {boothDetails.booth.name}
                </h4>
                <p className="text-sm text-gray-600">
                  {boothDetails.constituency.name},{' '}
                  {boothDetails.constituency.state.name}
                </p>
              </div>

              <div className="space-y-4">
                {Object.entries(boothDetails.booth.yearlyData)
                  .reverse()
                  .map(([year, data]) => (
                    <ElectionResultCard
                      key={year}
                      year={year}
                      data={data}
                      isWinner={year === '2024'}
                    />
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Interactive Legend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-lg mb-4">Interactive Legend</h3>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium">States</span>
                </div>
                <span className="text-xs text-gray-500">
                  Click to explore
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Assemblies</span>
                </div>
                <span className="text-xs text-gray-500">
                  Zoom in from states
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium">
                    Polling Booths
                  </span>
                </div>
                <span className="text-xs text-gray-500">Detailed view</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-medium text-sm mb-2">Navigation Tips</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Click markers to drill down</li>
                <li>• Use breadcrumbs to navigate back</li>
                <li>• Search to find specific locations</li>
                <li>• Switch between map and analytics views</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Latest News Widget */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <LatestNews
            userState={selectedState?.name || 'all'}
            limit={3}
            showFull={false}
          />
        </div>

        {/* Data Sources */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-lg mb-4">Data Sources</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Election Commission of India</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Wikipedia</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Form 20 Data</span>
            </div>
            {/* <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div> */}
          </div>
        </div>
      </div>
    </div>
      </div>
    </div>
  );
};

export default InteractiveElectionMap;
