import React, { useState, useRef, useEffect } from 'react';
import {
  Image,
  Volume2,
  Play,
  Pause,
  X,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  FileText,
  Download,
} from 'lucide-react';

const UpdateMediaDisplay = ({ update, className = '' }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Parse images from the update - check both imageUrls and attachments
  let images = [];
  
  // First check imageUrls (existing logic)
  if (update.imageUrls) {
    images = typeof update.imageUrls === 'string'
      ? JSON.parse(update.imageUrls)
      : update.imageUrls;
  }
  
  // Then check attachments array for image files
  if (update.attachments && Array.isArray(update.attachments)) {
    const attachmentImages = update.attachments.filter(url => {
      if (typeof url !== 'string') return false;
      const extension = url.split('.').pop()?.toLowerCase() || '';
      return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension);
    });
    images = [...images, ...attachmentImages];
  }

  // Check for audio in both audioUrl and attachments
  let audioUrl = update.audioUrl;
  if (!audioUrl && update.attachments && Array.isArray(update.attachments)) {
    const audioAttachment = update.attachments.find(url => {
      if (typeof url !== 'string') return false;
      const extension = url.split('.').pop()?.toLowerCase() || '';
      return ['mp3', 'wav', 'ogg', 'webm', 'm4a'].includes(extension);
    });
    audioUrl = audioAttachment;
  }

  // Get non-media attachments (documents, etc.)
  const documentAttachments = update.attachments ? 
    update.attachments.filter(url => {
      if (typeof url !== 'string') return false;
      const extension = url.split('.').pop()?.toLowerCase() || '';
      return !['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp3', 'wav', 'ogg', 'webm', 'm4a'].includes(extension);
    }) : [];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('ended', handleAudioEnded);
    audio.addEventListener('error', handleAudioError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('durationchange', updateDuration);
      audio.removeEventListener('ended', handleAudioEnded);
      audio.removeEventListener('error', handleAudioError);
    };
  }, []);

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
  };

  const handleCloseImageModal = () => {
    setSelectedImageIndex(null);
  };

  const navigateImage = (direction) => {
    setImageLoading(true);
    setSelectedImageIndex((prev) => {
      if (direction === 'prev') {
        return prev === 0 ? images.length - 1 : prev - 1;
      } else {
        return prev === images.length - 1 ? 0 : prev + 1;
      }
    });
  };

  const handleAudioToggle = () => {
    if (audioRef.current) {
      if (audioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setAudioPlaying(!audioPlaying);
    }
  };

  const handleAudioEnded = () => {
    setAudioPlaying(false);
    setCurrentTime(0);
  };

  const handleAudioError = (e) => {
    setAudioPlaying(false);
    console.error('Audio playback error:', e);
    if (e.target.error && e.target.error.code !== 2) {
      console.error('Audio error code:', e.target.error.code);
    }
  };

  const handleTimeChange = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || !isFinite(seconds) || isNaN(seconds)) {
      return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getFileName = (url) => {
    if (typeof url !== 'string') return 'Unknown file';
    return url.split('/').pop()?.split('?')[0] || 'Unknown file';
  };

  const handleDownload = (url) => {
    const link = document.createElement('a');
    link.href = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    link.download = getFileName(url);
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!images.length && !audioUrl && !documentAttachments.length) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Images Section */}
      {images.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Image className="h-4 w-4 text-primary/80" />
            <span className="text-sm font-semibold text-gray-700">
              Images ({images.length})
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {images.map((imageUrl, index) => (
              <div
                key={index}
                className="relative group cursor-pointer rounded-lg overflow-hidden bg-gray-100 aspect-square transition-all duration-200 hover:shadow-md"
                onClick={() => handleImageClick(index)}
              >
                <img
                  src={imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`}
                  alt={`Update attachment ${index + 1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    e.target.src = '/placeholder-image.svg';
                    e.target.alt = 'Image not found';
                  }}
                  onLoad={() => setImageLoading(false)}
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-opacity flex items-center justify-center">
                  <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audio Section */}
      {audioUrl && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Volume2 className="h-4 w-4 text-primary/80" />
            <span className="text-sm font-semibold text-gray-700">
              Audio Update
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={handleAudioToggle}
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 shadow ${
                  audioPlaying
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-primary hover:bg-primary/90 text-white'
                }`}
              >
                {audioPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" />
                )}
              </button>

              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleTimeChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    backgroundSize: `${(currentTime / (duration || 1)) * 100}% 100%`,
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{duration ? formatTime(duration) : '--:--'}</span>
                </div>
              </div>
            </div>

            <audio
              ref={audioRef}
              src={audioUrl.startsWith('http') ? audioUrl : `${API_BASE_URL}${audioUrl}`}
              onEnded={handleAudioEnded}
              onError={handleAudioError}
              preload="metadata"
              crossOrigin="anonymous"
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Document Attachments Section */}
      {documentAttachments.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-primary/80" />
            <span className="text-sm font-semibold text-gray-700">
              Attachments ({documentAttachments.length})
            </span>
          </div>
          <div className="space-y-2">
            {documentAttachments.map((docUrl, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate font-medium">
                    {getFileName(docUrl)}
                  </span>
                </div>
                <button
                  onClick={() => handleDownload(docUrl)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex-shrink-0"
                >
                  <Download className="h-3 w-3" />
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImageIndex !== null && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 pb-6">
          <div className="relative max-w-6xl w-full max-h-full flex flex-col">
            {/* Close Button */}
            <button
              onClick={handleCloseImageModal}
              className="absolute top-4 right-4 z-20 p-2 text-white hover:text-gray-300 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="h-8 w-8" />
            </button>

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => navigateImage('prev')}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 p-2 text-white hover:text-gray-300 rounded-full hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
                <button
                  onClick={() => navigateImage('next')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 p-2 text-white hover:text-gray-300 rounded-full hover:bg-white/10 transition-colors"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              </>
            )}

            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
                {selectedImageIndex + 1} / {images.length}
              </div>
            )}

            {/* Main Image */}
            <div className="flex-1 flex items-center justify-center">
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
              )}
              <img
                src={images[selectedImageIndex].startsWith('http') ? images[selectedImageIndex] : `${API_BASE_URL}${images[selectedImageIndex]}`}
                alt="Update attachment"
                className={`max-w-full max-h-[50vh] object-contain ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                crossOrigin="anonymous"
                onError={(e) => {
                  e.target.src = '/placeholder-image.svg';
                  e.target.alt = 'Image not found';
                }}
                onLoad={() => setImageLoading(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateMediaDisplay;