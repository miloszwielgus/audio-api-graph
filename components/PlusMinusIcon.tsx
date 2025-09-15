// components/PlusMinusIcon.tsx
import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface PlusMinusIconProps {
  color?: string;
  size?: number;
  isExpanded: boolean;
}

export const PlusMinusIcon: React.FC<PlusMinusIconProps> = ({
  color = '#abbcf5', // Default color (textHint from your palette)
  size = 18,
  isExpanded,
}) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* The horizontal line is always visible */}
      <Path d="M5 12h14" />

      {/* The vertical line is only visible when NOT expanded (to form a '+') */}
      {!isExpanded && <Path d="M12 5v14" />}
    </Svg>
  );
};