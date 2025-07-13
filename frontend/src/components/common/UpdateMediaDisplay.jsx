import React, { useState } from 'react';
import { Image, Volume2, Play, Pause, X, ZoomIn } from 'lucide-react';

const UpdateMediaDisplay = ({ update, className = '' }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioRef, setAudioRef] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Parse images from the update
  const images = update.imageUrls
    ? typeof update.imageUrls === 'string'
      ? JSON.parse(update.imageUrls)
      : update.imageUrls
    : [];
  const audioUrl = update.audioUrl;

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const handleCloseImageModal = () => {
    setSelectedImage(null);
  };

  const handleAudioToggle = () => {
    if (audioRef) {
      if (audioPlaying) {
        audioRef.pause();
      } else {
        audioRef.play();
      }
      setAudioPlaying(!audioPlaying);
    }
  };

  const handleAudioEnded = () => {
    setAudioPlaying(false);
  };

  const handleAudioError = (e) => {
    setAudioPlaying(false);
    console.error('Audio playback error:', e);
    // Don't show error for network issues during audio loading
    if (e.target.error && e.target.error.code !== 2) {
      console.error('Audio error code:', e.target.error.code);
    }
  };

  if (!images.length && !audioUrl) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Images Section */}
      {images.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Image className="h-3 w-3 text-gray-500" />
            <span className="text-xs text-gray-500">
              Images ({images.length})
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
            {images.map((imageUrl, index) => (
              <div
                key={index}
                className="relative group cursor-pointer rounded overflow-hidden bg-gray-100 aspect-square"
                onClick={() => handleImageClick(imageUrl)}
              >
                <img
                  src={`${API_BASE_URL}${imageUrl}`}
                  alt={`Update attachment ${index + 1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    e.target.src = '/placeholder-image.svg';
                    e.target.alt = 'Image not found';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                  <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audio Section */}
      {audioUrl && (
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Volume2 className="h-3 w-3 text-gray-500" />
            <span className="text-xs text-gray-500">Audio Update</span>
          </div>
          <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
            <button
              onClick={handleAudioToggle}
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                audioPlaying
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {audioPlaying ? (
                <Pause className="h-3 w-3" />
              ) : (
                <Play className="h-3 w-3 ml-0.5" />
              )}
            </button>
            <audio
              ref={setAudioRef}
              src={`${API_BASE_URL}${audioUrl}`}
              onEnded={handleAudioEnded}
              onError={handleAudioError}
              preload="metadata"
              crossOrigin="anonymous"
              className="hidden"
            />
            <div className="flex-1 text-xs text-gray-600">
              Click to play audio update
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={handleCloseImageModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="h-8 w-8" />
            </button>
            <img
              src={`${API_BASE_URL}${selectedImage}`}
              alt="Update attachment"
              className="max-w-full max-h-full object-contain"
              crossOrigin="anonymous"
              onError={(e) => {
                e.target.src = '/placeholder-image.svg';
                e.target.alt = 'Image not found';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateMediaDisplay;
