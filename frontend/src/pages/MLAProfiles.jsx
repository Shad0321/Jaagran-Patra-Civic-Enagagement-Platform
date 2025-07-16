import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

const MLAProfiles = () => {
  const [mlas, setMlas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  useEffect(() => {
    const fetchMLAs = async () => {
      setLoading(true);
      try {
        const baseUrl =
          import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const res = await fetch(
          `${baseUrl}/admin/public/mlas?page=${page}&limit=${limit}`
        );
        const data = await res.json();
        if (data.success) {
          setMlas(data.data.mlas);
          setPagination(
            data.data.pagination || { page: 1, limit: 10, total: 0, pages: 1 }
          );
        } else {
          toast.error(data.error || 'Failed to fetch MLA profiles');
        }
      } catch (err) {
        console.log(err);
        toast.error('Failed to fetch MLA profiles');
      } finally {
        setLoading(false);
      }
    };
    fetchMLAs();
  }, [page, limit]);

  const handlePrev = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNext = () => {
    if (page < pagination.pages) setPage(page + 1);
  };

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setPage(1); // Reset to first page on limit change
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-primary">
          MLA Profiles
        </h1>
        <div className="flex justify-between items-center mb-4">
          <div></div>
          <div className="flex items-center gap-2">
            <label htmlFor="limit" className="text-sm text-gray-600">
              Per page:
            </label>
            <select
              id="limit"
              value={limit}
              onChange={handleLimitChange}
              className="border rounded px-2 py-1 text-sm"
            >
              {[5, 10, 20, 50].map((val) => (
                <option key={val} value={val}>
                  {val}
                </option>
              ))}
            </select>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : mlas.length === 0 ? (
          <div className="text-center text-gray-500">
            No MLA profiles found.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mlas.map((mla) => (
                <div
                  key={mla.id}
                  className="bg-white rounded-lg shadow p-6 flex flex-col gap-2"
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                      {mla.name?.[0] || 'M'}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-dark">
                        {mla.name}
                      </h2>
                      <div className="text-sm text-gray-500">
                        {mla.position || 'MLA'}
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-700 font-medium">
                    Party:{' '}
                    <span className="font-normal">{mla.party || 'N/A'}</span>
                  </div>
                  <div className="text-gray-700 font-medium">
                    Constituency:{' '}
                    <span className="font-normal">
                      {mla.constituency || 'N/A'}
                    </span>
                  </div>
                  {mla.bio && (
                    <div className="text-gray-600 mt-2">{mla.bio}</div>
                  )}
                  {mla.achievements && (
                    <div className="text-gray-600 mt-1">
                      <b>Achievements:</b> {mla.achievements}
                    </div>
                  )}
                  <div className="mt-2 flex flex-col gap-1">
                    {mla.email && (
                      <div className="text-sm text-gray-500">
                        Email: {mla.email}
                      </div>
                    )}
                    {mla.phone && (
                      <div className="text-sm text-gray-500">
                        Phone: {mla.phone}
                      </div>
                    )}
                    {mla.address && (
                      <div className="text-sm text-gray-500">
                        Address: {mla.address}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Pagination Controls */}
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={handlePrev}
                disabled={page === 1}
                className={`px-3 py-1 rounded border ${page === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-primary border-primary hover:bg-primary hover:text-white'}`}
              >
                Previous
              </button>
              <span className="text-sm">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={handleNext}
                disabled={page === pagination.pages}
                className={`px-3 py-1 rounded border ${page === pagination.pages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-primary border-primary hover:bg-primary hover:text-white'}`}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MLAProfiles;
