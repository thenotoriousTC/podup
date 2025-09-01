import { useState, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { Recording } from './types';

export const useRecordingState = () => {
  const [podcastTitle, setPodcastTitle] = useState('');
  const [podcastDescription, setPodcastDescription] = useState('');
  const [podcastImage, setPodcastImage] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [showMetadataForm, setShowMetadataForm] = useState(false);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const metadataFormRef = useRef<View>(null);

  const resetForm = () => {
    setPodcastTitle('');
    setPodcastDescription('');
    setPodcastImage(null);
    setCategory('');
    setSelectedRecording(null);
    setShowMetadataForm(false);
  };

  const selectRecordingForPublish = (recording: Recording) => {
    setSelectedRecording(recording);
    setShowMetadataForm(true);
    setPodcastTitle(recording.title);
    
    setTimeout(() => {
      metadataFormRef.current?.measureInWindow((x, y) => {
        scrollViewRef.current?.scrollTo({
          y: y - 100, 
          animated: true
        });
      });
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
