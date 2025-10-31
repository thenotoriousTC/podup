import { View, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { TouchableOpacity } from '@/components/TouchableOpacity';
import React, { useState } from 'react';
import { StyledText } from '../StyledText';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';

interface SuggestionModalProps {
  visible: boolean;
  onClose: () => void;
}

const SuggestionModal = ({ visible, onClose }: SuggestionModalProps) => {
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const { session } = useAuth();

  const handleSubmit = async () => {
    if (!suggestion.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال اقتراحك.');
      return;
    }

    if (!session?.user) {
        Alert.alert('خطأ', 'يجب عليك تسجيل الدخول لتقديم اقتراح.');
        return;
    }

    setLoading(true);
    try {
      await supabase
        .from('suggestions')
        .insert({ content: suggestion })
        .throwOnError();

      Alert.alert('شكراً لك!', 'تم إرسال اقتراحك بنجاح.');
      setSuggestion('');
      onClose();
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إرسال اقتراحك.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => { if (!loading) onClose(); }}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ width: '80%', backgroundColor: 'white', borderRadius: 10, padding: 20, alignItems: 'center' }}>
          <StyledText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>اقترح ميزة جديدة</StyledText>
          <TextInput
            style={{ 
              color: 'black',
                width: '100%', 
                height: 100, 
                borderColor: 'gray', 
                borderWidth: 1, 
                borderRadius: 5, 
                padding: 10, 
                marginBottom: 20, 
                textAlignVertical: 'top',
                textAlign: 'right' // For Arabic text
            }}
            placeholder="اكتب اقتراحك هنا..."
            value={suggestion}
            onChangeText={setSuggestion}
            multiline
          />
          <TouchableOpacity 
            onPress={handleSubmit} 
            style={{ backgroundColor: '#1c1c1c', padding: 10, borderRadius: 5, width: '100%', alignItems: 'center' }}
            disabled={loading}
          >
            {loading ? (
                <ActivityIndicator color="#FD842B" />
            ) : (
                <StyledText style={{ color: 'white' }}>إرسال</StyledText>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={!loading ? onClose : undefined} disabled={loading} style={{ marginTop: 10 }}>
            <StyledText style={{ color: 'gray' }}>إغلاق</StyledText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default SuggestionModal;
