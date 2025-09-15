import React, { Suspense } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StyledText } from './StyledText';

interface LazyScreenProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const DefaultFallback = () => (
  <View className="flex-1 justify-center items-center bg-white">
    <ActivityIndicator size="large" color="#4F46E5" />
    <StyledText className="mt-4 text-gray-600">جاري التحميل...</StyledText>
  </View>
);

export const LazyScreen: React.FC<LazyScreenProps> = ({ 
  children, 
  fallback = <DefaultFallback /> 
}) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};

// HOC for lazy loading screens
export function withLazyLoading<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: React.ReactNode
) {
  const LazyComponent = React.lazy(() => Promise.resolve({ default: Component }));
  
  return (props: T) => (
    <LazyScreen fallback={fallback}>
      <LazyComponent {...props} />
    </LazyScreen>
  );
}
