import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Award,
  Users,
  ChevronDown,
  ChevronUp,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Link,
} from 'lucide-react';
import { partyLogos } from '../utils/constants';
import Loader from '../components/common/Loader';

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
        console.error(err);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-100 py-12 px-4">
      <div className="w-full h-96 -py-12 -px-6">
        <img
          src="https://www.shutterstock.com/image-photo/north-block-building-secretariat-central-600nw-1215992257.jpg"
          alt="Rashtrapati Bhawan with flag"
          className="w-full h-full min-h-96 object-cover"
        />
      </div>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center my-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-gray-700 to-slate-600 bg-clip-text text-transparent mb-4">
            Legislative Assembly Members
          </h1>
          <p className="text-gray-600 text-lg">
            Meet your elected representatives
          </p>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-sm text-gray-500">
            Showing {mlas.length} of {pagination.total} members
          </div>
          <div className="flex items-center gap-3">
            <label
              htmlFor="limit"
              className="text-sm font-medium text-gray-700"
            >
              Per page:
            </label>
            <select
              id="limit"
              value={limit}
              onChange={handleLimitChange}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
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
          <Loader />
        ) : mlas.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            <Users className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="text-lg">No MLA profiles found.</p>
          </div>
        ) : (
          <>
            {/* Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {mlas.map((mla) => {
                const parsedSocialLinks =
                  typeof mla.socialLinks === 'string'
                    ? JSON.parse(mla.socialLinks)
                    : mla.socialLinks;
                if (!parsedSocialLinks || !parsedSocialLinks.facebook) {
                  parsedSocialLinks.facebook = '';
                }
                if (!parsedSocialLinks || !parsedSocialLinks.twitter) {
                  parsedSocialLinks.twitter = '';
                }
                if (!parsedSocialLinks || !parsedSocialLinks.instagram) {
                  parsedSocialLinks.instagram = '';
                }
                if (!parsedSocialLinks || !parsedSocialLinks.linkedin) {
                  parsedSocialLinks.linkedin = '';
                }
                if (!parsedSocialLinks || !parsedSocialLinks.website) {
                  parsedSocialLinks.website = '';
                }
                return (
                  <div
                    key={mla.id}
                    className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
                  >
                    {/* Card Header with Gradient */}
                    <div className="bg-gradient-to-r from-primary to-primary p-6 relative">
                      <div className="absolute inset-0 bg-black/5"></div>
                      <div className="relative flex items-center gap-4">
                        <div className="relative">
                          {mla.avatar ? (
                            <img
                              src={mla.avatar}
                              alt={mla.name}
                              className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-lg"
                            />
                          ) : (
                            <div className="h-20 w-20 rounded-full bg-white/20 border-4 border-white shadow-lg flex items-center justify-center">
                              <User className="h-10 w-10 text-white" />
                            </div>
                          )}
                          <div className="absolute bottom-0 right-0 bg-emerald-500 rounded-full p-1">
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold text-white mb-1">
                            {mla.name}
                          </h2>
                          <h6 className="text-sm font-bold text-white mb-1">
                            {mla.party}
                          </h6>
                          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                            <Award className="h-4 w-4 text-white" />
                            <span className="text-white font-medium text-sm">
                              {mla.position || 'MLA'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 space-y-4">
                      {/* Party and Constituency */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-4">
                          <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                            Political Party
                          </div>
                          <div className="flex items-center gap-3">
                            {getPartyLogo(mla.party) ? (
                              <img
                                src={getPartyLogo(mla.party)}
                                alt={`${mla.party} logo`}
                                className="h-8 w-8 object-contain rounded-md bg-white p-1 shadow-sm border"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="h-8 w-8 bg-gradient-to-br from-slate-200 to-gray-300 rounded-md flex items-center justify-center">
                                <Users className="h-4 w-4 text-slate-600" />
                              </div>
                            )}
                            <div className="text-slate-800 font-semibold">
                              {mla.party || 'Independent'}
                            </div>
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-stone-50 to-slate-50 rounded-xl p-4">
                          <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                            Constituency
                          </div>
                          <div className="text-slate-800 font-semibold">
                            {mla.constituency || 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Bio */}
                        <CollapsibleText
                          text={mla.bio}
                          title="Biography"
                          bgGradient="bg-gradient-to-r from-amber-50 to-orange-50"
                          titleColor="text-amber-700"
                          maxLength={150}
                        />

                        {/* Achievements */}
                        <CollapsibleText
                          text={mla.achievements}
                          title="Key Achievements"
                          bgGradient="bg-gradient-to-r from-emerald-50 to-teal-50"
                          titleColor="text-emerald-700"
                          maxLength={150}
                        />
                      </div>

                      {/* Contact Information */}
                      <div className="border-t border-gray-100 pt-4">
                        <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
                          Contact Information
                        </div>
                        <div className="space-y-2">
                          {mla.email && (
                            <div className="flex items-center gap-3 text-sm">
                              <Mail className="h-4 w-4 text-slate-500" />
                              <span className="text-slate-700">
                                {mla.email}
                              </span>
                            </div>
                          )}
                          {mla.phone && (
                            <div className="flex items-center gap-3 text-sm">
                              <Phone className="h-4 w-4 text-slate-500" />
                              <span className="text-slate-700">
                                {mla.phone}
                              </span>
                            </div>
                          )}
                          {mla.address && (
                            <div className="flex items-start gap-3 text-sm">
                              <MapPin className="h-4 w-4 text-slate-500 mt-0.5" />
                              <span className="text-slate-700">
                                {mla.address}
                              </span>
                            </div>
                          )}
                        </div>
                        {(mla.socialLinks.facebook !== '' ||
                          mla.socialLinks.twitter !== '' ||
                          mla.socialLinks.instagram !== '' ||
                          mla.socialLinks.linkedin !== '' ||
                          mla.socialLinks.website !== '') &&
                          Object.keys(parsedSocialLinks).length > 0 && (
                            <div className="border-t border-gray-100 pt-4">
                              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
                                Social Links
                              </div>
                              <div className="flex flex-row flex-wrap gap-3">
                                {parsedSocialLinks?.facebook && (
                                  <a
                                    href={parsedSocialLinks.facebook}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all duration-300 hover:shadow-md border border-blue-100 hover:border-blue-200"
                                  >
                                    <div className="p-2 bg-blue-500 rounded-lg group-hover:bg-blue-600 transition-colors duration-300">
                                      <Facebook className="h-4 w-4 text-white" />
                                    </div>
                                    {/* <span className="text-blue-700 font-medium text-sm group-hover:text-blue-800 transition-colors duration-300">Facebook</span> */}
                                  </a>
                                )}
                                {parsedSocialLinks?.twitter && (
                                  <a
                                    href={parsedSocialLinks.twitter}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-sky-50 to-sky-100 hover:from-sky-100 hover:to-sky-200 transition-all duration-300 hover:shadow-md border border-sky-100 hover:border-sky-200"
                                  >
                                    <div className="p-2 bg-sky-500 rounded-lg group-hover:bg-sky-600 transition-colors duration-300">
                                      <Twitter className="h-4 w-4 text-white" />
                                    </div>
                                    {/* <span className="text-sky-700 font-medium text-sm group-hover:text-sky-800 transition-colors duration-300">Twitter</span> */}
                                  </a>
                                )}
                                {parsedSocialLinks?.instagram && (
                                  <a
                                    href={parsedSocialLinks.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-pink-50 to-rose-100 hover:from-pink-100 hover:to-rose-200 transition-all duration-300 hover:shadow-md border border-pink-100 hover:border-rose-200"
                                  >
                                    <div className="p-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg group-hover:from-pink-600 group-hover:to-rose-600 transition-all duration-300">
                                      <Instagram className="h-4 w-4 text-white" />
                                    </div>
                                    {/* <span className="text-pink-700 font-medium text-sm group-hover:text-pink-800 transition-colors duration-300">Instagram</span> */}
                                  </a>
                                )}
                                {parsedSocialLinks?.linkedin && (
                                  <a
                                    href={parsedSocialLinks.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-100 hover:from-blue-100 hover:to-indigo-200 transition-all duration-300 hover:shadow-md border border-blue-100 hover:border-indigo-200"
                                  >
                                    <div className="p-2 bg-blue-600 rounded-lg group-hover:bg-blue-700 transition-colors duration-300">
                                      <Linkedin className="h-4 w-4 text-white" />
                                    </div>
                                    {/* <span className="text-blue-700 font-medium text-sm group-hover:text-blue-800 transition-colors duration-300">LinkedIn</span> */}
                                  </a>
                                )}
                                {parsedSocialLinks?.website && (
                                  <a
                                    href={parsedSocialLinks.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-slate-100 hover:from-gray-100 hover:to-slate-200 transition-all duration-300 hover:shadow-md border border-gray-100 hover:border-slate-200"
                                  >
                                    <div className="p-2 bg-slate-600 rounded-lg group-hover:bg-slate-700 transition-colors duration-300">
                                      <Link className="h-4 w-4 text-white" />
                                    </div>
                                    {/* <span className="text-slate-700 font-medium text-sm group-hover:text-slate-800 transition-colors duration-300">Website</span> */}
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-center items-center gap-6 mt-12">
              <button
                onClick={handlePrev}
                disabled={page === 1}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                  page === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-slate-700 border-2 border-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-700 shadow-md hover:shadow-lg'
                }`}
              >
                ← Previous
              </button>

              <div className="bg-white rounded-full px-6 py-3 border-2 border-slate-300 shadow-md">
                <span className="text-sm font-semibold text-slate-700">
                  Page {pagination.page} of {pagination.pages}
                </span>
              </div>

              <button
                onClick={handleNext}
                disabled={page === pagination.pages}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                  page === pagination.pages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-slate-700 border-2 border-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-700 shadow-md hover:shadow-lg'
                }`}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const getPartyLogo = (partyName) => {
  if (!partyName) return null;
  const normalizedParty = partyName.toUpperCase().trim();
  return partyLogos[normalizedParty] || null;
};

const CollapsibleText = ({
  text,
  title,
  bgGradient,
  titleColor,
  maxLength = 150,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  const shouldTruncate = text.length > maxLength;
  const displayText =
    shouldTruncate && !isExpanded ? text.slice(0, maxLength) + '...' : text;

  return (
    <div className={`${bgGradient} rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <div
          className={`text-xs font-semibold ${titleColor} uppercase tracking-wider`}
        >
          {title}
        </div>
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                Read More
              </>
            )}
          </button>
        )}
      </div>
      <p className="text-slate-700 text-sm leading-relaxed">{displayText}</p>
    </div>
  );
};
export default MLAProfiles;
