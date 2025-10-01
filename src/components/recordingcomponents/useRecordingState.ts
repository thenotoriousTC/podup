import { useState, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { Recording } from './types';

export const useRecordingState = (setRecordings: React.Dispatch<React.SetStateAction<Recording[]>>) => {
  console.log('🟨 [DEBUG] useRecordingState: Hook invoked');
  const [podcastTitle, setPodcastTitle] = useState('');
  const [podcastDescription, setPodcastDescription] = useState('');
  const [podcastImage, setPodcastImage] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [showMetadataForm, setShowMetadataForm] = useState(false);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);

  console.log('🟦 [DEBUG] useRecordingState state:', {
    showMetadataForm,
    selectedRecordingId: selectedRecording?.id,
    isCategoryModalVisible,
    podcastTitle,
    category,
  });

  const scrollViewRef = useRef<ScrollView | null>(null);
  const metadataFormRef = useRef<View | null>(null);

  const resetForm = () => {
    console.log('🔄 [DEBUG] resetForm: START');
    const startTime = Date.now();
    
    console.log('🔄 [DEBUG] resetForm: Clearing form fields...');
    setPodcastTitle('');
    setPodcastDescription('');
    setPodcastImage(null);
    setCategory('');
    
    console.log('🔄 [DEBUG] resetForm: Clearing selected recording...');
    setSelectedRecording(null);
    
    console.log('🔄 [DEBUG] resetForm: Hiding metadata form...');
    setShowMetadataForm(false);
    
    console.log('🔄 [DEBUG] resetForm: Clearing recordings list...');
    setRecordings([]);
    
    console.log('✅ [DEBUG] resetForm: COMPLETE in', Date.now() - startTime, 'ms');
  };

  const selectRecordingForPublish = (recording: Recording) => {
    console.log(' [PERF] selectRecordingForPublish: START');
    const startTime = Date.now();
    console.log(' [PERF] Setting selected recording:', recording.id);
    setSelectedRecording(recording);
    console.log(' [PERF] Setting show metadata form to true');
    setShowMetadataForm(true);
    
    // Scroll to metadata form after a brief delay
    console.log(' [PERF] Setting up scroll timeout...');
    setTimeout(() => {
      console.log(' [PERF] Scroll timeout triggered');
      if (metadataFormRef.current && scrollViewRef.current) {
        console.log(' [PERF] Measuring layout for scroll...');
        metadataFormRef.current.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            console.log(' [PERF] Scrolling to position:', y - 50);
            scrollViewRef.current?.scrollTo({ y: y - 50, animated: true });
          },
          () => console.warn(' [PERF] Failed to measure layout')
        );
      } else {
        console.log(' [PERF] Refs not available for scrolling');
      }
      console.log(' [PERF] selectRecordingForPublish: COMPLETE in', Date.now() - startTime, 'ms');
    }, 100);
  };

  return {
    podcastTitle, setPodcastTitle,
    podcastDescription, setPodcastDescription,
    podcastImage, setPodcastImage,
    category, setCategory,
    showMetadataForm, setShowMetadataForm,
    isCategoryModalVisible, setCategoryModalVisible,
    selectedRecording, setSelectedRecording,
    scrollViewRef,
    metadataFormRef,
    resetForm,
    selectRecordingForPublish,
  };
};
