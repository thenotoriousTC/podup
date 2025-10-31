import { View, ActivityIndicator } from 'react-native';

export const LoadingState = () => {
  return (
    <View className="flex-1 items-center justify-center p-4 pt-12">
      <ActivityIndicator size="large" color="#FD842B" />
    </View>
  );
};
