import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { scale as s } from '@/constants/scaling';

// Props for the radial line progress wheel - accepts progress externally
interface Props {
  size?: number;
  strokeWidth?: number;
  color?: string; // Color for inactive segments (remaining time)
  activeColor?: string; // Color for active segments (elapsed time)
  progress?: number; // Progress proportion (0 to 1, representing elapsed time)
  segments?: number;
  lineLengthRatio?: number;
  innerRadiusRatio?: number;
}

// Helper function to convert polar coordinates to Cartesian
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

export default function ProgressWheel({
  size = s(100),
  strokeWidth = 1,
  color = '#ffffff', // Default inactive: white
  activeColor = '#000000', // Default active: black
  progress = 0, // Default progress: 0
  segments = 24,
  innerRadiusRatio = 0.6,
  lineLengthRatio = 0.4,
}: Props) {

  // Log received props
 

  // Calculate geometry
  const center = size / 2;
  const outerRadius = size / 2;
  const innerRadius = outerRadius * innerRadiusRatio;
  const lineLength = outerRadius * lineLengthRatio;
  const segmentAngle = 360 / segments;

  // Calculate active segments based on external progress prop
  const normalizedProgress = Math.max(0, Math.min(1, progress)); // Ensure 0-1 range
 
  const elapsedSegments = normalizedProgress > 0 
                          ? Math.ceil(normalizedProgress * segments) 
                          : Math.floor(normalizedProgress * segments);
  
  const finalElapsedCount = (normalizedProgress >= 0.9999) ? segments : elapsedSegments;


  // Render the lines
  const lines = [];
  for (let i = 0; i < segments; i++) {
    const angle = i * segmentAngle;
    const start = polarToCartesian(center, center, innerRadius, angle);
    const end = polarToCartesian(center, center, innerRadius + lineLength, angle);

    // Determine color based on whether the segment is considered elapsed
    const currentStrokeColor = i < finalElapsedCount ? activeColor : color;

    lines.push(
      <Line
        key={i}
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={currentStrokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    );
  }

  // Return the SVG containing the lines
  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {lines}
      </Svg>
    </View>
  );
}

// Basic styles for centering
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 