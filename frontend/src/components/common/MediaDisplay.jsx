import React, { useState, useRef, useEffect } from 'react';
import {
  Image,
  Volume2,
  VolumeX,
  Play,
  Pause,
  X,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const MediaDisplay = ({ issue, className = '' }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Parse images from the issue
  const images = issue.images
    ? typeof issue.images === 'string'
      ? JSON.parse(issue.images)
      : issue.images
    : [];
  const voiceNote = issue.voiceNote;

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
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!images.length && !voiceNote) {
    return null;
  }

  return (
    <div className={`flex flex-col space-y-4 md:space-y-6 ${className}`}>
      {/* Images Section */}
      {images.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-lg md:rounded-xl shadow border border-primary/10 p-3 md:p-4">
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <Image className="h-4 w-4 md:h-5 md:w-5 text-primary/80" />
            <span className="text-xs md:text-sm font-semibold text-gray-700">
              Images ({images.length})
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 md:gap-2">
            {images.map((imageUrl, index) => (
              <div
                key={index}
                className="relative group cursor-pointer rounded-md md:rounded-lg overflow-hidden bg-gray-100 aspect-square transition-all duration-200 hover:shadow-md"
                onClick={() => handleImageClick(index)}
              >
                <img
                  src={`${imageUrl}`}
                  alt={`Issue attachment ${index + 1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    e.target.src = '/placeholder-image.svg';
                    e.target.alt = 'Image not found';
                  }}
                  onLoad={() => setImageLoading(false)}
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-opacity flex items-center justify-center">
                  <ZoomIn className="h-4 w-4 md:h-5 md:w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audio Section - Improved Mobile Layout */}
      {voiceNote && (
        <div className="bg-white/80 backdrop-blur-sm rounded-lg md:rounded-xl shadow border border-primary/10 p-3 md:p-4">
          <div className="flex items-center gap-2 mb-3">
            <Volume2 className="h-4 w-4 md:h-5 md:w-5 text-primary/80" />
            <span className="text-xs md:text-sm font-semibold text-gray-700">
              Voice Note
            </span>
          </div>

          {/* Mobile-first audio controls layout */}
          <div className="space-y-3">
            {/* Play button and time display - stacked on very small screens */}
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={handleAudioToggle}
                className={`flex-shrink-0 flex items-center justify-center w-12 h-12 sm:w-10 sm:h-10 rounded-full transition-all duration-200 shadow-md ${
                  audioPlaying
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-primary hover:bg-primary/90 text-white'
                }`}
              >
                {audioPlaying ? (
                  <Pause className="h-5 w-5 sm:h-4 sm:w-4" />
                ) : (
                  <Play className="h-5 w-5 sm:h-4 sm:w-4 ml-0.5" />
                )}
              </button>

              {/* Time display - visible on all screen sizes */}
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 font-medium">
                <span className="whitespace-nowrap min-w-[2.5rem]">
                  {formatTime(currentTime)}
                </span>
                <span className="text-gray-400">/</span>
                <span className="whitespace-nowrap min-w-[2.5rem]">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Progress bar - full width */}
            <div className="w-full">
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleTimeChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                {/* Custom slider styling */}
                <style jsx>{`
                  .slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #3b82f6;
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                  }

                  .slider::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #3b82f6;
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                  }

                  .slider::-webkit-slider-track {
                    height: 8px;
                    border-radius: 4px;
                    background: linear-gradient(
                      to right,
                      #3b82f6 0%,
                      #3b82f6 ${(currentTime / (duration || 1)) * 100}%,
                      #e5e7eb ${(currentTime / (duration || 1)) * 100}%,
                      #e5e7eb 100%
                    );
                  }
                `}</style>
              </div>
            </div>
          </div>

          <audio
            ref={audioRef}
            src={`${voiceNote}`}
            onEnded={handleAudioEnded}
            onError={handleAudioError}
            preload="metadata"
            crossOrigin="anonymous"
            className="hidden"
          />
        </div>
      )}

      {/* Image Modal */}
      {selectedImageIndex !== null && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="relative w-full max-w-4xl max-h-full flex flex-col">
            {/* Close Button */}
            <button
              onClick={handleCloseImageModal}
              className="absolute top-1 right-1 sm:top-2 sm:right-2 z-20 p-1 sm:p-2 text-white hover:text-gray-300 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="h-6 w-6 sm:h-8 sm:w-8" />
            </button>

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => navigateImage('prev')}
                  className="absolute left-1 sm:left-4 top-1/2 transform -translate-y-1/2 z-20 p-1 sm:p-2 text-white hover:text-gray-300 rounded-full hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
                </button>
                <button
                  onClick={() => navigateImage('next')}
                  className="absolute right-1 sm:right-4 top-1/2 transform -translate-y-1/2 z-20 p-1 sm:p-2 text-white hover:text-gray-300 rounded-full hover:bg-white/10 transition-colors"
                >
                  <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
                </button>
              </>
            )}

            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute top-2 sm:top-4 left-1/2 transform -translate-x-1/2 z-20 px-2 py-0.5 sm:px-3 sm:py-1 bg-black/50 text-white text-xs sm:text-sm rounded-full">
                {selectedImageIndex + 1} / {images.length}
              </div>
            )}

            {/* Main Image */}
            <div className="flex-1 flex items-center justify-center">
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-white"></div>
                </div>
              )}
              <img
                src={`${images[selectedImageIndex]}`}
                alt="Issue attachment"
                className={`w-full max-h-[80vh] object-contain ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
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

export default MediaDisplay;
