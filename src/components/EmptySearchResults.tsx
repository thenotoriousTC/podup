import { View } from 'react-native';
import { TouchableOpacity } from '@/components/TouchableOpacity';
import { Ionicons } from '@expo/vector-icons';
import { StyledText } from './StyledText';

interface EmptySearchResultsProps {
  onClearSearch: () => void;
}

export const EmptySearchResults = ({ onClearSearch }: EmptySearchResultsProps) => {
  return (
    <View className="flex-1 items-center justify-center mt-20">
      <Ionicons name="search" size={64} color="#FD842B" />
      <StyledText fontWeight="Medium" className="text-gray-500 text-lg font-medium mt-4">
        لم يتم العثور على محتوى
      </StyledText>
      <StyledText className="text-gray-400 text-sm mt-2 text-center px-8">
        حاول تحسين كلمات البحث أو ابحث عن محتوى مختلف
      </StyledText>
      <TouchableOpacity 
        onPress={onClearSearch}
        className="mt-4 bg-[#FD842B] px-6 py-3 rounded-lg"
        activeOpacity={0.8}
      >
        <StyledText fontWeight="Medium" className="text-white font-medium">مسح البحث</StyledText>
      </TouchableOpacity>
    </View>
  );
};
