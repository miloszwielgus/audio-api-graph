// components/SlidersIcon.tsx
import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

interface SlidersIconProps {
  color?: string;
  size?: number;
}

export const SlidersIcon: React.FC<SlidersIconProps> = ({
  color = '#abbcf5', // Default color (textHint from your palette)
  size = 18,
}) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M4 21v-7" />
      <Path d="M4 10V3" />
      <Path d="M12 21v-9" />
      <Path d="M12 8V3" />
      <Path d="M20 21v-5" />
      <Path d="M20 12V3" />
      <Path d="M1 14h6" />
      <Path d="M9 8h6" />
      <Path d="M17 16h6" />
    </Svg>
  );
};