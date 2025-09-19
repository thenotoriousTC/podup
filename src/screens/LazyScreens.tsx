import React from 'react';
import { LazyScreen } from '@/components/LazyScreen';

// Lazy load heavy screens to reduce initial bundle size
export const LazyDiscoverScreen = React.lazy(() => 
  import('@/app/(protected)/(tabs)/discover').then(module => ({
    default: module.default
  }))
);

export const LazyRecordingScreen = React.lazy(() => 
  import('@/app/(protected)/(tabs)/recording').then(module => ({
    default: module.default
  }))
);

export const LazyPodcastScreen = React.lazy(() => 
  import('@/app/(protected)/podcast/[id]').then(module => ({
    default: module.default
  }))
);

export const LazySeriesScreen = React.lazy(() => 
  import('@/app/(protected)/series/[id]').then(module => ({
    default: module.default
  }))
);

export const LazyCreatorScreen = React.lazy(() => 
  import('@/app/(protected)/creator/[id]').then(module => ({
    default: module.default
  }))
);

// Wrapper components with loading states
export const DiscoverScreenWithLazy = (props: any) => (
  <LazyScreen>
    <LazyDiscoverScreen {...props} />
  </LazyScreen>
);

export const RecordingScreenWithLazy = (props: any) => (
  <LazyScreen>
    <LazyRecordingScreen {...props} />
  </LazyScreen>
);

export const PodcastScreenWithLazy = (props: any) => (
  <LazyScreen>
    <LazyPodcastScreen {...props} />
  </LazyScreen>
);

export const SeriesScreenWithLazy = (props: any) => (
  <LazyScreen>
    <LazySeriesScreen {...props} />
  </LazyScreen>
);

export const CreatorScreenWithLazy = (props: any) => (
  <LazyScreen>
    <LazyCreatorScreen {...props} />
  </LazyScreen>
);
