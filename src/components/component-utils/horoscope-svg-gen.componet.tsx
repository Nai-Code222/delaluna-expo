import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';

export default function MoonPhase({ 
  phase = 'new', // 'new', 'waxing-crescent', 'first-quarter', 'waxing-gibbous', 'full', 'waning-gibbous', 'last-quarter', 'waning-crescent'
  size = 70,
  color = '#ffffff', // Single color prop for moon, outline, and label
  showLabel = false
}) {
  const renderPhase = () => {
    switch(phase) {
      case 'new':
        return (
          <>
            <Circle cx="0" cy="0" r="35" fill="transparent" stroke={color} strokeWidth="2"/>
          </>
        );
      
      case 'waxing-crescent':
        return (
          <>
            <Circle cx="0" cy="0" r="35" fill="transparent"/>
            <Path d="M 0,-35 A 35,35 0 0,1 0,35 A 28,35 0 0,0 0,-35" fill={color}/>
            <Circle cx="0" cy="0" r="35" fill="none" stroke={color} strokeWidth="2"/>
          </>
        );
      
      case 'first-quarter':
        return (
          <>
            <Circle cx="0" cy="0" r="35" fill="transparent"/>
            <Path d="M 0,-35 A 35,35 0 0,1 0,35 L 0,-35" fill={color}/>
            <Circle cx="0" cy="0" r="35" fill="none" stroke={color} strokeWidth="2"/>
          </>
        );
      
      case 'waxing-gibbous':
        return (
          <>
            <Circle cx="0" cy="0" r="35" fill="transparent"/>
            <Path d="M 0,-35 A 35,35 0 0,1 0,35 A 18,35 0 0,1 0,-35" fill={color}/>
            <Circle cx="0" cy="0" r="35" fill="none" stroke={color} strokeWidth="2"/>
          </>
        );
      
      case 'full':
        return (
          <>
            <Circle cx="0" cy="0" r="35" fill={color} stroke={color} strokeWidth="2"/>
          </>
        );
      
      case 'waning-gibbous':
        return (
          <>
            <Circle cx="0" cy="0" r="35" fill="transparent"/>
            <Path d="M 0,-35 A 35,35 0 0,0 0,35 A 18,35 0 0,0 0,-35" fill={color}/>
            <Circle cx="0" cy="0" r="35" fill="none" stroke={color} strokeWidth="2"/>
          </>
        );
      
      case 'last-quarter':
        return (
          <>
            <Circle cx="0" cy="0" r="35" fill="transparent"/>
            <Path d="M 0,-35 A 35,35 0 0,0 0,35 L 0,-35" fill={color}/>
            <Circle cx="0" cy="0" r="35" fill="none" stroke={color} strokeWidth="2"/>
          </>
        );
      
      case 'waning-crescent':
        return (
          <>
            <Circle cx="0" cy="0" r="35" fill="transparent"/>
            <Path d="M 0,-35 A 35,35 0 0,0 0,35 A 28,35 0 0,1 0,-35" fill={color}/>
            <Circle cx="0" cy="0" r="35" fill="none" stroke={color} strokeWidth="2"/>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="-35 -35 70 70">
        <G>
          {renderPhase()}
        </G>
      </Svg>
      {showLabel && (
        <Text style={{ color: color, marginTop: 8, fontSize: 12 }}>
          {phase.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </Text>
      )}
    </View>
  );
}