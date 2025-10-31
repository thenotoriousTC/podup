import React from 'react';
import { Pressable } from '@/components/Pressable';
import { Text, StyleSheet, ActivityIndicator } from 'react-native';;



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
        <ActivityIndicator color="#FD842B" />
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
    borderColor: '#FD842B',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderColor: '#FD842B',
  },
  text: {
    color: '#FD842B',
    fontWeight: 'bold',
    marginRight: 8,
  },
  count: {
    color: '#FD842B',
    fontSize: 12,
  },
});
