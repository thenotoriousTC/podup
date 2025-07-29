import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AudioFile } from './types';

export const useUploadState = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [audio, setAudio] = useState<AudioFile | null>(null);
  const [category, setCategory] = useState('');
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user: supaUser }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching current user:', error.message);
      } else {
        setCurrentUser(supaUser);
        if (supaUser) {
          setAuthor(supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || supaUser.email?.split('@')[0] || '');
        }
      }
    };
    fetchCurrentUser();
  }, []);

  const resetState = () => {
      setTitle('');
      if (currentUser) {
        setAuthor(currentUser.user_metadata?.full_name || '');
      }
      setDescription('');
      setImage(null);
      setAudio(null);
      setCategory('');
  }

  return {
    currentUser,
    title, setTitle,
    author, setAuthor,
    description, setDescription,
    image, setImage,
    audio, setAudio,
    category, setCategory,
    isCategoryModalVisible, setCategoryModalVisible,
    resetState
  };
};
