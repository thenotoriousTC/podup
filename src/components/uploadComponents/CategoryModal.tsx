import React from 'react';
import { View, Modal, FlatList, TouchableOpacity, Pressable } from 'react-native';
import { StyledText } from '@/components/StyledText';
import { categories } from './constants';

interface CategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCategory: (category: string) => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ visible, onClose, onSelectCategory }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white rounded-2xl p-6 w-4/5">
          <StyledText className="text-xl font-semibold text-gray-800 mb-4">اختر الفئة</StyledText>
          <FlatList
            data={categories}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  onSelectCategory(item);
                  onClose();
                }}
                className="p-4 border-b border-gray-200"
              >
                <StyledText className="text-base dark:text-black">{item}</StyledText>
              </TouchableOpacity>
            )}
          />
          <Pressable
            onPress={onClose}
            className="mt-4 bg-red-500 p-3 rounded-lg items-center"
          >
            <StyledText className="text-white font-semibold">إغلاق</StyledText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default CategoryModal;
