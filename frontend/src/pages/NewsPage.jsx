import React from 'react';
import LatestNews from '../components/LatestNews';

const NewsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LatestNews showFull={true} />
      </div>
    </div>
  );
};

export default NewsPage;
