import React, { useState } from 'react';

const LoadingComponent = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const summaryScore = 10; // Static score of 50

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);

  return (
    <div
      className="relative h-48 w-48 rounded-md overflow-hidden shadow-md pulse"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      style={{
        cursor: 'pointer',
        outline: 'none',
        transition: 'all 0.3s ease',
      }}
      aria-label="Loading"
    >
      <style>
        {`
         
          .pulse {
            animation: pulse 2s infinite;
          }
          @keyframes fillPulse {
            0% { clip-path: inset(${100 - summaryScore}% 0 0 0); }
            50% { clip-path: inset(${100 - Math.min(summaryScore + 70, 100)}% 0 0 0); }
            100% { clip-path: inset(${100 - summaryScore}% 0 0 0); }
          }
        `}
      </style>
      {/* Background Layer: Unfilled part in grayscale or hover/pressed colors */}
      <div
        className="absolute inset-0 bg-contain bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(/flags/Blank_globe.svg)`,
          filter: isHovered || isPressed ? 'none' : 'grayscale(100%) opacity(0.5)',
          backgroundColor: 'transparent',
          zIndex: 1,
        }}
      />
      {/* Foreground Layer: Globe image with pulsing fill effect */}
      <div
        className="absolute inset-0 bg-contain bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(/flags/Blank_globe.svg)`,
          clipPath: `inset(${100 - summaryScore}% 0 0 0)`,
          zIndex: 2,
          animation: isHovered ? 'none' : 'fillPulse 2s infinite',
        }}
      />
    </div>
  );
};

export default LoadingComponent;