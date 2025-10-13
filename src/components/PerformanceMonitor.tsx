/*import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { StyledText } from './StyledText';

/**
 * Performance Monitor Component
 * Shows real-time FPS and memory usage in development mode
 * 
 * Based on React Native performance monitoring best practices
 * Auto-disabled in production builds
 */
/*
export function PerformanceMonitor(): JSX.Element | null {
  const [fps, setFps] = useState<number>(60);
  const [memoryUsage, setMemoryUsage] = useState<string>('--');
  const lastFrameTime = useRef<number>(Date.now());
  const frameCount = useRef<number>(0);

  useEffect(() => {
    // Only run in development
    if (!__DEV__) return;

    // FPS calculation
    const fpsInterval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastFrameTime.current;
      
      if (delta > 0) {
        const currentFps = Math.round(1000 / delta);
        setFps(Math.min(60, currentFps)); // Cap at 60
      }
      
      lastFrameTime.current = now;
      frameCount.current += 1;
    }, 1000 / 60); // Check every frame

    // Memory usage (if available)
    const memoryInterval = setInterval(() => {
      if ((performance as any).memory) {
        const used = (performance as any).memory.usedJSHeapSize;
        const total = (performance as any).memory.totalJSHeapSize;
        const usedMB = (used / 1048576).toFixed(1);
        const totalMB = (total / 1048576).toFixed(1);
        setMemoryUsage(`${usedMB}/${totalMB} MB`);
      }
    }, 2000); // Update every 2 seconds

    return () => {
      clearInterval(fpsInterval);
      clearInterval(memoryInterval);
    };
  }, []);

  // Don't render in production
  if (!__DEV__) return null;

  // Color based on FPS
  const getColor = (): string => {
    if (fps >= 55) return '#10b981'; // Green - good
    if (fps >= 45) return '#f59e0b'; // Orange - warning
    return '#ef4444'; // Red - poor
  };

  return (
    <View style={[styles.container, { backgroundColor: getColor() }]}>
      <StyledText style={styles.text}>
        FPS: {fps}
      </StyledText>
      {memoryUsage !== '--' && (
        <StyledText style={styles.textSmall}>
          {memoryUsage}
        </StyledText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    padding: 8,
    borderRadius: 6,
    zIndex: 9999,
    minWidth: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  textSmall: {
    color: 'white',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
});
*/