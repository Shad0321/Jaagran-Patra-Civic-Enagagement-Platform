import React, { useState, useEffect } from'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { MapPin, TrendingUp, Users, Award, Info } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Import custom marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';

// Custom icons for different types of markers
const defaultIcon = new Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const stateIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3B82F6" width="30" height="30">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `),
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

const assemblyIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10B981" width="25" height="25">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `),
  iconSize: [25, 25],
  iconAnchor: [12, 25],
  popupAnchor: [0, -25]
});

const pollingBoothIcon = new Icon({
  iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#F59E0B" width="20" height="20">
      <circle cx="12" cy="9" r="2" fill="#FFFFFF"/>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `),
  iconSize: [20, 20],
  iconAnchor: [10, 20],
  popupAnchor: [0, -20]
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

// Component for election result comparison
const ElectionResultCard = ({ year, data, isWinner = false }) => (
  <div className={`p-3 rounded-lg border-2 ${isWinner ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
    <div className="flex justify-between items-center mb-2">
      <h4 className="font-semibold text-lg">{year}</h4>
      {isWinner && <Award className="w-5 h-5 text-green-600" />}
    </div>
    <div className="space-y-2">
      <div className={`p-2 rounded ${isWinner ? 'bg-green-100' : 'bg-gray-100'}`}>
        <div className="font-medium text-green-700">Winner: {data.winner.candidate}</div>
        <div className="text-sm text-gray-600">
          {data.winner.party} • {data.winner.votes.toLocaleString()} votes ({data.winner.percentage}%)
        </div>
      </div>
      <div className="p-2 rounded bg-gray-100">
        <div className="font-medium text-red-700">Runner-up: {data.runnerUp.candidate}</div>
        <div className="text-sm text-gray-600">
          {data.runnerUp.party} • {data.runnerUp.votes.toLocaleString()} votes ({data.runnerUp.percentage}%)
        </div>
      </div>
      <div className="text-center text-sm font-medium text-blue-600">
        Margin: {data.margin.toLocaleString()} votes
      </div>
    </div>
  </div>
);

const InteractiveElectionMap = () => {
  const [mapLevel, setMapLevel] = useState('india'); // 'india', 'state', 'assembly', 'polling'
  const [selectedState, setSelectedState] = useState(null);
  const [selectedAssembly, setSelectedAssembly] = useState(null);
  const [selectedPollingBooth, setSelectedPollingBooth] = useState(null);
  const [mapData, setMapData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // India center
  const [mapZoom, setMapZoom] = useState(5);
  const [selectedYear, setSelectedYear] = useState('2024');
  const [boothDetails, setBoothDetails] = useState(null);

  // Fetch states for India map
  const fetchStates = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/map/states`);
      const data = await response.json();
      if (data.success) {
        setMapData(data.data);
      }
    } catch (error) {
      console.error('Error fetching states:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch assemblies for selected state
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

  // Fetch polling booths for selected assembly
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

  // Fetch detailed polling booth data
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

  // Initialize with states
  useEffect(() => {
    fetchStates();
  }, []);

  // Handle state selection
  const handleStateClick = (state) => {
    setSelectedState(state);
    setMapLevel('state');
    setMapCenter([state.latitude || 20.5937, state.longitude || 78.9629]);
    setMapZoom(7);
    fetchAssemblies(state.id);
  };

  // Handle assembly selection
  const handleAssemblyClick = (assembly) => {
    setSelectedAssembly(assembly);
    setMapLevel('assembly');
    setMapCenter([assembly.latitude || 20.5937, assembly.longitude || 78.9629]);
    setMapZoom(10);
    fetchPollingBooths(assembly.id);
  };

  // Handle polling booth selection
  const handlePollingBoothClick = (booth) => {
    setSelectedPollingBooth(booth);
    setMapLevel('polling');
    setMapCenter([booth.latitude, booth.longitude]);
    setMapZoom(12);
    fetchPollingBoothDetails(booth.constituencyId, booth.name);
  };

  // Go back to previous level
  const goBack = () => {
    if (mapLevel === 'polling') {
      setMapLevel('assembly');
      setSelectedPollingBooth(null);
      setBoothDetails(null);
      setMapCenter([selectedAssembly.latitude, selectedAssembly.longitude]);
      setMapZoom(10);
      fetchPollingBooths(selectedAssembly.id);
    } else if (mapLevel === 'assembly') {
      setMapLevel('state');
      setSelectedAssembly(null);
      setMapCenter([selectedState.latitude, selectedState.longitude]);
      setMapZoom(7);
      fetchAssemblies(selectedState.id);
    } else if (mapLevel === 'state') {
      setMapLevel('india');
      setSelectedState(null);
      setMapCenter([20.5937, 78.9629]);
      setMapZoom(5);
      fetchStates();
    }
  };

  // Get appropriate icon based on map level
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

  // Get marker click handler based on map level
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Election Map</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <MapPin className="w-4 h-4" />
                <span>
                  {mapLevel === 'india' && 'India'}
                  {mapLevel === 'state' && selectedState?.name}
                  {mapLevel === 'assembly' && `${selectedState?.name} > ${selectedAssembly?.name}`}
                  {mapLevel === 'polling' && `${selectedState?.name} > ${selectedAssembly?.name} > ${selectedPollingBooth?.name}`}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Year Selector */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="2024">2024</option>
                <option value="2022">2022</option>
              </select>

              {/* Back Button */}
              {mapLevel !== 'india' && (
                <button
                  onClick={goBack}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  ← Back
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Container */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="h-96 lg:h-[600px]">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading map data...</p>
                    </div>
                  </div>
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
                    
                    {mapData.map((item, index) => (
                      item.latitude && item.longitude && (
                        <Marker
                          key={index}
                          position={[item.latitude, item.longitude]}
                          icon={getMarkerIcon()}
                          eventHandlers={{
                            click: getMarkerClickHandler(item)
                          }}
                        >
                          <Popup>
                            <div className="p-2">
                              <h3 className="font-semibold text-lg">{item.name}</h3>
                              {item.electionData && (
                                <div className="mt-2 space-y-1 text-sm">
                                  <p><strong>Total Votes:</strong> {item.electionData.Total_Votes_Constituency?.toLocaleString()}</p>
                                  <p><strong>NOTA Votes:</strong> {item.electionData.NOTA_Votes_Constituency?.toLocaleString()}</p>
                                  {item.electionData.Party_Votes_Assembly_Aggregated && (
                                    <div>
                                      <strong>Party Votes:</strong>
                                      <ul className="ml-2">
                                        {Object.entries(item.electionData.Party_Votes_Assembly_Aggregated).map(([party, votes]) => (
                                          <li key={party}>{party}: {votes.toLocaleString()}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}
                              {item.electionResults && (
                                <div className="mt-2 space-y-1 text-sm">
                                  <p><strong>Winner:</strong> {item.electionResults.winner.candidate} ({item.electionResults.winner.party})</p>
                                  <p><strong>Votes:</strong> {item.electionResults.winner.votes.toLocaleString()} ({item.electionResults.winner.percentage}%)</p>
                                  <p><strong>Margin:</strong> {item.electionResults.margin.toLocaleString()}</p>
                                </div>
                              )}
                              <p className="mt-2 text-xs text-blue-600 cursor-pointer">Click to zoom in</p>
                            </div>
                          </Popup>
                        </Marker>
                      )
                    ))}
                  </MapContainer>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Level Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Info className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-lg">Current View</h3>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Level:</strong> {mapLevel.charAt(0).toUpperCase() + mapLevel.slice(1)}</p>
                <p><strong>Year:</strong> {selectedYear}</p>
                <p><strong>Data Points:</strong> {mapData.length}</p>
                {selectedState && <p><strong>State:</strong> {selectedState.name}</p>}
                {selectedAssembly && <p><strong>Assembly:</strong> {selectedAssembly.name}</p>}
                {selectedPollingBooth && <p><strong>Polling Booth:</strong> {selectedPollingBooth.name}</p>}
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-lg">Statistics</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="font-semibold text-blue-600">{mapData.length}</div>
                  <div className="text-gray-600">
                    {mapLevel === 'india' && 'States'}
                    {mapLevel === 'state' && 'Assemblies'}
                    {mapLevel === 'assembly' && 'Polling Booths'}
                    {mapLevel === 'polling' && 'Detail Views'}
                  </div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="font-semibold text-green-600">
                    {mapData.filter(item => item.electionData || item.electionResults).length}
                  </div>
                  <div className="text-gray-600">With Data</div>
                </div>
              </div>
            </div>

            {/* Polling Booth Details */}
            {boothDetails && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Users className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-lg">Election Results Comparison</h3>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">{boothDetails.booth.name}</h4>
                  <p className="text-sm text-gray-600">
                    {boothDetails.constituency.name}, {boothDetails.constituency.state.name}
                  </p>
                  
                  <div className="space-y-4">
                    {Object.entries(boothDetails.booth.yearlyData).map(([year, data]) => (
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

            {/* Legend */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-lg mb-4">Map Legend</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span>States</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span>Assemblies/Constituencies</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <span>Polling Booths</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveElectionMap;
