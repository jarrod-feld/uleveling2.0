import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
// import SoloPopup from '@/components/common/SoloPopup'; // Removed for now
import LevelHeader from '@/components/stats/LevelHeader';
import StatGrid from '@/components/stats/StatGrid';
// import { mockStats } from '@/mock/statsData'; // Use stats from context
import { verticalScale as vScale, scale as s, moderateScale as ms } from '@/constants/scaling';
import { useAuth } from '@/contexts/UserContext'; // Import useAuth hook
import { Stat } from '@/mock/statsData'; // Keep Stat type if needed
import { UserTitle } from '@/services/TitleService';

const FONT_FAMILY = 'PressStart2P'; // Define font family

export default function StatsTab() {
  const {
    profile,
    stats,
    isLoading,
    availableTitles, // Get available titles
    updateTitle,     // Get function to update equipped title
  } = useAuth();

  const [isTitleModalVisible, setIsTitleModalVisible] = useState(false);
  const [isUpdatingTitle, setIsUpdatingTitle] = useState(false);

  // Handle loading state
  if (isLoading || !profile || !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // Convert UserStats map back to an array for StatGrid
  const statsArray: Stat[] = Object.values(stats);

  const handleSelectTitle = async (titleId: string) => {
    if (isUpdatingTitle || titleId === profile.title?.id) {
        setIsTitleModalVisible(false); // Close modal if same title or already updating
        return;
    }
    setIsUpdatingTitle(true);
    try {
      await updateTitle(titleId);
      // Update should reflect in profile state automatically via context
    } catch (error: any) {
      console.error("Failed to update title:", error.message);
      // Optionally show error feedback
    } finally {
      setIsUpdatingTitle(false);
      setIsTitleModalVisible(false);
    }
  };

  const renderTitleItem = ({ item }: { item: UserTitle }) => (
    <Pressable
      style={({ pressed }) => [
        styles.modalItem,
        pressed && styles.modalItemPressed,
        item.id === profile.title?.id && styles.modalItemSelected, // Highlight selected
      ]}
      onPress={() => handleSelectTitle(item.id)}
      disabled={isUpdatingTitle}
    >
      <Text style={styles.modalItemText}>{item.name}</Text>
      {item.id === profile.title?.id && <Text style={styles.selectedIndicator}> (Equipped)</Text>}
    </Pressable>
  );

  return (
    // <SoloPopup> // Removed for now
    <View style={styles.container}>
      {/* Wrap LevelHeader title in TouchableOpacity to open modal */}
      <TouchableOpacity onPress={() => setIsTitleModalVisible(true)} disabled={isUpdatingTitle}>
        <LevelHeader
          level={profile.level}
          username={profile.name}
          title={profile.title?.name ?? 'No Title'}
        />
        {/* Add visual cue for interaction */} 
        <Text style={styles.changeTitleHint}>(Tap title to change)</Text>
      </TouchableOpacity>

      {/* Description Text */}
      <Text style={styles.descriptionText}>
        Complete daily quests to increase your skills. Staying consistent will increase your discipline stat.
      </Text>

      {/* Pass dynamic data to StatGrid */}
      <StatGrid data={statsArray} />

      {/* Title Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isTitleModalVisible}
        onRequestClose={() => setIsTitleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Title</Text>
            {isUpdatingTitle && <ActivityIndicator style={{ marginBottom: vScale(10) }} color="#64ffda"/>}
            <FlatList
              data={availableTitles}
              renderItem={renderTitleItem}
              keyExtractor={(item) => item.id}
              style={styles.modalList}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsTitleModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
    // </SoloPopup> // Removed for now
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: vScale(20), // Reduced paddingBottom as no scroll space needed
    flexGrow: 1,
    backgroundColor: '#001a22', // Dark blue background matching image
    paddingHorizontal: s(10), // Add some horizontal padding
    paddingTop: vScale(20) // Add paddingTop to avoid content sticking to the top status bar/notch
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#001a22', // Match background
  },
  descriptionText: {
    fontFamily: FONT_FAMILY, // Use PressStart2P font
    fontSize: ms(10), // Adjust font size as needed
    color: '#ccd6f6', // Light text color
    textAlign: 'center', // Center align text
    marginHorizontal: s(20),
    marginTop: vScale(20),
    lineHeight: ms(15), // Adjust line height for readability
    // Add text shadow for subtle glow
    textShadowColor: 'rgba(100, 255, 218, 0.5)', // Aqua glow
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  changeTitleHint: {
      fontFamily: 'System',
      fontSize: ms(9),
      color: '#8892b0',
      textAlign: 'center',
      marginTop: vScale(0),
      marginBottom: vScale(10),
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Dark overlay
  },
  modalContent: {
    width: '85%',
    maxHeight: '70%', // Limit modal height
    backgroundColor: '#0a192f', // Dark blue modal background
    borderRadius: s(10),
    padding: s(20),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#64ffda', // Accent border
  },
  modalTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: ms(16),
    color: '#ccd6f6',
    marginBottom: vScale(15),
  },
  modalList: {
      width: '100%', // Ensure list takes full width of modal content
  },
  modalItem: {
    paddingVertical: vScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#112240', // Slightly darker separator
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalItemPressed: {
      backgroundColor: '#112240', // Darker background on press
  },
  modalItemSelected: {
      backgroundColor: 'rgba(100, 255, 218, 0.1)', // Subtle highlight for selected
  },
  modalItemText: {
    fontFamily: FONT_FAMILY,
    color: '#a8b2d1',
    fontSize: ms(12),
  },
  selectedIndicator: {
      fontFamily: 'System',
      color: '#64ffda',
      fontSize: ms(10),
      marginLeft: s(5),
  },
  closeButton: {
    marginTop: vScale(20),
    backgroundColor: '#112240',
    paddingVertical: vScale(10),
    paddingHorizontal: s(20),
    borderRadius: s(5),
  },
  closeButtonText: {
    fontFamily: FONT_FAMILY,
    color: '#64ffda',
    fontSize: ms(12),
  },
}); // Added flexGrow 