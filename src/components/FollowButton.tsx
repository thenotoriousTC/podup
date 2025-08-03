import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useFollow } from '../hooks/useFollow';
import { useAuth } from '../providers/AuthProvider'; // Assuming an AuthProvider provides the user session

type FollowButtonProps = {
  creatorId?: string;
  podcastId?: string;
};

export const FollowButton = ({ creatorId, podcastId }: FollowButtonProps) => {
  const { user } = useAuth();
  const { isFollowing, followersCount, toggleFollow, isLoading, isToggling } = useFollow({
    userId: user?.id,
    creatorId,
    podcastId,
  });

  if (isLoading) {
    return <ActivityIndicator />;
  }

  return (
    <Pressable
      onPress={toggleFollow}
      disabled={isToggling}
      style={[styles.button, isFollowing ? styles.followingButton : styles.followButton]}
    >
      <Text style={styles.text}>{isFollowing ? 'Following' : 'Follow'}</Text>
      <Text style={styles.count}>{followersCount}</Text>
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
    color: '#4F46E5',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderColor: '#4F46E5',
    color: '#4F46E5',
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
