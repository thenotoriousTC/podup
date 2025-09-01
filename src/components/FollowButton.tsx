import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';



type FollowButtonProps = {
  isFollowing: boolean;
  followersCount: number;
  onPress: () => void;
  isToggling: boolean;
};

export const FollowButton = ({ isFollowing, followersCount, onPress, isToggling }: FollowButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={isToggling}
      style={[styles.button, isFollowing ? styles.followingButton : styles.followButton]}
    >
      {isToggling ? (
        <ActivityIndicator color="#4F46E5" />
      ) : (
        <>
          <Text style={styles.text}>{isFollowing ? 'Following' : 'Follow'}</Text>
          <Text style={styles.count}>{followersCount}</Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  followButton: {
    backgroundColor: 'white',
    borderColor: '#4F46E5',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderColor: '#4F46E5',
  },
  text: {
    color: '#4F46E5',
    fontWeight: 'bold',
    marginRight: 8,
  },
  count: {
    color: '#4F46E5',
    fontSize: 12,
  },
});
