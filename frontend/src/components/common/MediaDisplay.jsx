import React, { useState } from 'react';
import { Image, Volume2, VolumeX, Play, Pause, X, ZoomIn } from 'lucide-react';

const MediaDisplay = ({ issue, className = '' }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioRef, setAudioRef] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Parse images from the issue
  const images = issue.images ? (typeof issue.images === 'string' ? JSON.parse(issue.images) : issue.images) : [];
  const voiceNote = issue.voiceNote;

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

  if (!images.length && !voiceNote) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Images Section */}
      {images.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Image className="h-4 w-4 mr-2" />
            Images ({images.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {images.map((imageUrl, index) => (
              <div
                key={index}
                className="relative group cursor-pointer rounded-lg overflow-hidden bg-gray-100 aspect-square"
                onClick={() => handleImageClick(imageUrl)}
              >
                <img
                  src={`${API_BASE_URL}${imageUrl}`}
                  alt={`Issue attachment ${index + 1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    e.target.src = '/placeholder-image.svg';
                    e.target.alt = 'Image not found';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                  <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audio Section */}
      {voiceNote && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Volume2 className="h-4 w-4 mr-2" />
            Voice Note
          </h4>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <button
              onClick={handleAudioToggle}
              className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                audioPlaying 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {audioPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </button>
            <div className="flex-1">
              <div className="text-sm text-gray-700">Voice Note</div>            <audio
              ref={setAudioRef}
              src={`${API_BASE_URL}${voiceNote}`}
              onEnded={handleAudioEnded}
              onError={handleAudioError}
              preload="metadata"
              crossOrigin="anonymous"
              className="w-full h-6 mt-1"
              controls
            />
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
              alt="Issue attachment"
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

export default MediaDisplay;
