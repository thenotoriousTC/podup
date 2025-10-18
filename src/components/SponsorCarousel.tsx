import { View, Image, Linking, Alert, Dimensions } from 'react-native';
import { useCallback } from 'react';
import Carousel from 'react-native-reanimated-carousel';
import { Pressable } from '@/components/Pressable';
import { sponsors, Sponsor } from '@/constants/sponsors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_WIDTH = SCREEN_WIDTH * 0.9;
const CAROUSEL_HEIGHT = 180;

export default function SponsorCarousel() {
  const handleSponsorPress = useCallback(async (sponsor: Sponsor) => {
    try {
      // Open the link directly - HTTPS URLs should always work
      await Linking.openURL(sponsor.link);
    } catch (error) {
      console.error('Error opening sponsor link:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء فتح الرابط. تأكد من وجود متصفح أو تطبيق إنستغرام.');
    }
  }, []);

  const renderItem = useCallback(({ item }: { item: Sponsor }) => {
    return (
      <Pressable
        onPress={() => handleSponsorPress(item)}
        style={{
          flex: 1,
          borderRadius: 16,
          overflow: 'hidden',
          marginHorizontal: 8,
          backgroundColor: '#f5f5f5',
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }}
      >
        <Image
          source={item.imagePath}
          style={{
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
          }}
        />
      </Pressable>
    );
  }, [handleSponsorPress]);

  if (sponsors.length === 0) {
    return null;
  }

  return (
    <View 
      style={{ 
        width: SCREEN_WIDTH,
        height: CAROUSEL_HEIGHT + 20,
        paddingVertical: 10,
      }}
    >
      <Carousel
        loop
        autoPlay
        autoPlayInterval={3000}
        scrollAnimationDuration={500}
        width={CAROUSEL_WIDTH}
        height={CAROUSEL_HEIGHT}
        style={{
          width: SCREEN_WIDTH,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        data={sponsors}
        renderItem={renderItem}
        pagingEnabled={true}
        snapEnabled={true}
      />
    </View>
  );
}
