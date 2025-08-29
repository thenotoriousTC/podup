import React from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { StyledText } from '@/components/StyledText';

interface PodcastFormProps {
  title: string;
  setTitle: (title: string) => void;
  author: string;
  setAuthor: (author: string) => void;
  description: string;
  setDescription: (description: string) => void;
  category: string;
  onCategoryPress: () => void;
  disabled: boolean;
}

const PodcastFormComponent: React.FC<PodcastFormProps> = ({ 
  title, setTitle, 
  author, setAuthor, 
  description, setDescription, 
  category, onCategoryPress, 
  disabled 
}) => {
  return (
    <View className="space-y-4">
      <View>
        <StyledText className="text-gray-700 font-semibold mb-2 text-right">
          العنوان *
        </StyledText>
        <TextInput
          className={`bg-white p-4 rounded-2xl text-base text-right dark:text-black border border-gray-200 shadow-sm ${
            disabled ? 'opacity-50' : ''
          }`}
          placeholder="أدخل العنوان"
          value={title}
          onChangeText={setTitle}
          editable={!disabled}
        />
      </View>

      <View>
        <StyledText className="text-gray-700 font-semibold mb-2 text-right">
          المبدع *
        </StyledText>
        <TextInput
          className={`bg-white p-4 rounded-2xl text-base text-right dark:text-black border border-gray-200 shadow-sm ${
            disabled ? 'opacity-50' : ''
          }`}
          placeholder="أدخل اسم المبدع"
          value={author}
          onChangeText={setAuthor}
          editable={!disabled}
        />
      </View>

      <View>
        <StyledText className="text-gray-700 font-semibold mb-2 text-right">
          الفئة *
        </StyledText>
        <Pressable
          onPress={onCategoryPress}
          disabled={disabled}
          className={`bg-white p-4 rounded-2xl border border-gray-200 shadow-sm ${
            disabled ? 'opacity-50' : ''
          }`}
        >
          <StyledText className="text-base dark:text-black text-right">{category || 'اختر الفئة'}</StyledText>
        </Pressable>
      </View>

      <View>
        <StyledText className="text-gray-700 font-semibold mb-2 text-right">
          الوصف *
        </StyledText>
        <TextInput
          className={`bg-white p-4 rounded-2xl text-base text-right dark:text-black border border-gray-200 shadow-sm ${
            disabled ? 'opacity-50' : ''
          }`}
          placeholder="أدخل وصف البودكاست"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
          maxLength={500}
          textAlignVertical="top"
          style={{ minHeight: 100 }}
          editable={!disabled}
        />
      </View>
    </View>
  );
};

export default PodcastFormComponent;
