import React from 'react'

const Loader = ({ className }) => {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div
                className="w-10 h-10 border-4 border-t-blue-600 border-gray-300 rounded-full animate-spin"
            ></div>
        </div>
    )
}

export default Loader
