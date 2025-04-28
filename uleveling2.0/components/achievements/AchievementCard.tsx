import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { scale as s, moderateScale as ms, verticalScale as vScale } from '@/constants/scaling';
import { AchievementDefinition } from '@/data/achievementsData';
import { UserAchievementStatus } from '@/services/AchievementService'; // Correct path if renamed

// Define the props for the component
interface AchievementCardProps {
  definition: AchievementDefinition;
  status: UserAchievementStatus;
  onClaim: (achievementId: string) => Promise<void>; // Function to handle claim action
}

const FONT_FAMILY = 'PressStart2P';

export default function AchievementCard({ definition, status, onClaim }: AchievementCardProps) {
  const [isClaiming, setIsClaiming] = useState(false);

  // Determine if the details should be hidden
  const showMystery = definition.isHidden && !status.isUnlocked;

  const handleClaimPress = async () => {
    if (!status.canClaim || isClaiming) return;
    setIsClaiming(true);
    try {
      await onClaim(definition.id);
      // No need to set isClaiming false immediately if the parent component causes a re-render
      // Parent state update should change status.canClaim / status.isClaimed, hiding the button
    } catch (error) {
      console.error(`Error claiming achievement ${definition.id}:`, error);
      setIsClaiming(false); // Reset loading state on error
      // Optionally show an error message to the user
    }
    // Removed setIsClaiming(false) here - rely on state change from parent
  };

  // Determine card style based on status
  const cardStyle = [
    styles.box,
    status.isClaimed ? styles.claimedBox :
    status.isUnlocked ? styles.unlockedBox :
    styles.lockedBox,
    showMystery && styles.mysteryBox, // Add specific style for mystery
  ];

  const textStyle = [
      styles.txt,
      !status.isUnlocked && styles.lockedTxt,
      showMystery && styles.mysteryText, // Apply mystery text style
  ];

  const descriptionStyle = [
      styles.descriptionTxt,
       !status.isUnlocked && styles.lockedTxt,
       showMystery && styles.mysteryText, // Apply mystery text style
  ];

  return (
    <View style={cardStyle}>
      <Text style={textStyle}>
          {showMystery ? '???' : definition.title}
      </Text>
      <Text style={descriptionStyle}>
          {showMystery ? 'Complete hidden requirements to unlock.' : definition.description}
      </Text>
      {/* TODO: Optionally display requirements here (could also hide if showMystery is true) */} 

      {status.canClaim && (
        <TouchableOpacity
          style={styles.claimButton}
          onPress={handleClaimPress}
          disabled={isClaiming}
        >
          {isClaiming ? (
            <ActivityIndicator size="small" color="#001a22" />
          ) : (
            <Text style={styles.claimButtonText}>Claim Reward</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 2,
    borderRadius: s(8),
    padding: s(15),
    marginHorizontal: s(20),
    marginTop: vScale(15),
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Base semi-transparent background
  },
  lockedBox: {
    borderColor: '#555', // Darker border for locked
    backgroundColor: 'rgba(50, 50, 50, 0.3)',
  },
  unlockedBox: {
    borderColor: '#ffd700', // Gold border for claimable
     backgroundColor: 'rgba(255, 215, 0, 0.1)', // Light gold background tint
  },
  claimedBox: {
    borderColor: '#4CAF50', // Green border for claimed
    backgroundColor: 'rgba(76, 175, 80, 0.15)', // Light green background tint
  },
  mysteryBox: {
      borderColor: '#8892b0', // Neutral grey border
      backgroundColor: 'rgba(136, 146, 176, 0.05)',
  },
  txt: {
    fontFamily: FONT_FAMILY,
    color: '#ccd6f6', // Light text color
    fontSize: ms(12),
    marginBottom: vScale(5),
  },
  descriptionTxt: {
    fontFamily: 'System', // Use a more readable font for description
    color: '#a8b2d1', // Slightly dimmer text color
    fontSize: ms(10),
    marginBottom: vScale(10),
  },
  lockedTxt: {
      color: '#777', // Greyed out text for locked state
  },
  mysteryText: {
      color: '#8892b0', // Use a neutral grey for mystery text
      fontStyle: 'italic',
  },
  claimButton: {
    backgroundColor: '#64ffda', // Accent color
    paddingVertical: vScale(8),
    paddingHorizontal: s(12),
    borderRadius: s(5),
    alignItems: 'center',
    marginTop: vScale(10),
    alignSelf: 'flex-start', // Prevent button from stretching full width
  },
  claimButtonText: {
    fontFamily: FONT_FAMILY,
    color: '#001a22', // Dark text on button
    fontSize: ms(10),
  },
}); 