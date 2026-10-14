import React, { useState, useEffect } from 'react';

const CountryImage = ({ userData, upgradeGroups, onMouseEnter, onMouseLeave }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Calculate the summary score based on upgrade levels
  const calculateSummaryScore = () => {
    if (!userData || !userData.upgrades || !upgradeGroups) return 0;
    const groupNames = Object.keys(upgradeGroups);
    const groupLevels = groupNames.map(group => {
      const upgradesInGroup = Object.keys(userData.upgrades).filter(key => upgradeGroups[group].includes(key));
      if (upgradesInGroup.length === 0) return 0;
      const totalLevel = upgradesInGroup.reduce((sum, key) => sum + (userData.upgrades[key] || 0), 0);
      return totalLevel / upgradesInGroup.length;
    });
    const totalScore = groupLevels.reduce((sum, level) => sum + level, 0);
    const maxPossibleScore = groupNames.length * 100;
    return Math.round((totalScore / maxPossibleScore) * 100);
  };

  const summaryScore = calculateSummaryScore();
  const geoName = typeof userData.country === 'string' ? userData.country : 'Unknown';
  const flagUrl = `/flags/${geoName.toLowerCase().replace(/ /g, '_')}.svg`;

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);

  return (
    <div
      className="relative h-16 w-24 rounded-md overflow-hidden shadow-md"
      onMouseEnter={() => {
        setIsHovered(true);
        if (onMouseEnter) onMouseEnter({ id: geoName });
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
        if (onMouseLeave) onMouseLeave();
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    //   style={{
    //     cursor: 'pointer',
    //     outline: 'none',
    //     transition: 'all 0.3s ease',
    //     animation: 'pulse 4s infinite', // Match HomePage.js pulse animation
    //   }}
      aria-label={geoName}
    >
      <style>
        {`
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
            100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
          }
          @keyframes fillPulse {
            0% { clip-path: inset(${100 - summaryScore}% 0 0 0); }
            50% { clip-path: inset(${100 - Math.min(summaryScore + 10, 100)}% 0 0 0); }
            100% { clip-path: inset(${100 - summaryScore}% 0 0 0); }
          }
        `}
      </style>
      {/* Background Layer: Unfilled part in grayscale or hover/pressed colors */}
      <div
        className="absolute inset-0 bg-contain bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${flagUrl})`,
          filter: isHovered || isPressed ? 'none' : 'grayscale(100%) opacity(0.5)',
          backgroundColor: isPressed ? 'transparent' : isHovered ? 'transparent' : 'transparent',
          zIndex: 1,
          //border: `solid ${isHovered || isPressed ? 1 : 0.5}px #FFF`,
        }}
      />
      {/* Foreground Layer: Flag image with pulsing fill effect */}
      <div
        className="absolute inset-0 bg-contain bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${flagUrl})`,
          clipPath: `inset(${100 - summaryScore}% 0 0 0)`,
          zIndex: 2,
          //border: `solid ${isHovered || isPressed ? 1 : 0.5}px #FFF`,
          animation: isHovered ? 'none' : 'fillPulse 2s infinite', // Disable animation on hover
        }}
      />
    </div>
  );
};

export default CountryImage;