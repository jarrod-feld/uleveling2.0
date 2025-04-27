import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import { PencilSimpleLine } from 'phosphor-react-native';
import { scale as s, verticalScale as vs, moderateScale as ms } from '@/constants/scaling';
import { useAuth } from '@/contexts/UserContext';
import SoloPopup from '@/components/common/SoloPopup';

const FONT_FAMILY = 'PressStart2P';
const EDIT_POPUP_HEIGHT = vs(200);

interface Props {
  level: number;
  title: string;
}

export default function LevelHeader({ level, title }: Props) {
  const { user, updateUserProfile, isLoading } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newName, setNewName] = useState('');

  const username = user?.user_metadata?.name || 'Player';

  useEffect(() => {
    console.log(`[LevelHeader Effect] User object changed. Current username derived: ${username}`);
  }, [user]);

  const openEditModal = () => {
    setNewName(username);
    setIsModalVisible(true);
  };

  const handleSaveUsername = async () => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Username cannot be empty.');
      return;
    }
    if (trimmedName === username) {
        setIsModalVisible(false);
        return;
    }

    console.log(`[LevelHeader] Attempting to save new username: ${trimmedName}`);
    const { error } = await updateUserProfile({ name: trimmedName });

    if (error) {
      console.error('[LevelHeader] Error updating username:', error.message);
      Alert.alert('Error', `Failed to update username: ${error.message}`);
    } else {
      console.log('[LevelHeader] Username update successful (context should reflect change).');
      setIsModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.levelContainer}>
        <Text style={styles.levelText}>{level}</Text>
        <Text style={styles.levelLabel}>Level</Text>
      </View>
      <View style={styles.userInfoContainer}>
        <Pressable style={styles.usernameRow} onPress={openEditModal} disabled={isLoading}>
          <Text style={styles.usernameText}>{username}</Text>
          <PencilSimpleLine size={ms(14)} color="#fff" style={styles.editIcon}/>
        </Pressable>
        <Text style={styles.titleText}>Title: {title}</Text>
      </View>

      <SoloPopup
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        requiredHeight={EDIT_POPUP_HEIGHT}
        disableBackdropClose={false}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Username</Text>
          <TextInput
            style={styles.modalInput}
            value={newName}
            onChangeText={setNewName}
            placeholder="Enter new username"
            placeholderTextColor="#555"
            maxLength={50}
            autoCapitalize="words"
            returnKeyType="done"
            autoFocus
          />
          <View style={styles.modalButtonRow}>
            <Pressable 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={() => setIsModalVisible(false)} 
              disabled={isLoading}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </Pressable>
            <Pressable 
              style={[styles.modalButton, styles.saveButton]} 
              onPress={handleSaveUsername} 
              disabled={isLoading}
            >
              <Text style={styles.modalButtonText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </SoloPopup>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: s(20),
    paddingVertical: ms(10),
    marginTop: ms(15),
  },
  levelContainer: {
    alignItems: 'center',
    marginRight: s(15),
    minWidth: s(60),
  },
  levelText: {
    fontFamily: FONT_FAMILY,
    fontSize: ms(36),
    color: '#fff',
    lineHeight: ms(38),
  },
  levelLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: ms(10),
    color: '#aaa',
    marginTop: ms(0),
  },
  userInfoContainer: {
    flex: 1,
    alignItems: 'flex-start',
    marginBottom: ms(4),
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(4),
  },
  usernameText: {
    fontFamily: FONT_FAMILY,
    fontSize: ms(16),
    color: '#fff',
  },
  editIcon: {
    marginLeft: s(6),
  },
  titleText: {
    fontFamily: FONT_FAMILY,
    fontSize: ms(10),
    color: '#aaa',
  },

  modalContent: {
    width: '100%',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(10),
    paddingHorizontal: ms(10),
  },
  modalTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: ms(14),
    color: '#fff',
    marginBottom: vs(15),
    textAlign: 'center',
  },
  modalInput: {
    width: '90%',
    backgroundColor: '#1e2a3a',
    color: '#ffffff',
    fontSize: ms(12),
    paddingHorizontal: ms(10),
    paddingVertical: vs(8),
    borderWidth: ms(2),
    borderColor: '#00ffff',
    borderRadius: ms(3),
    textAlign: 'center',
    fontFamily: FONT_FAMILY,
    marginBottom: vs(20),
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    marginTop: vs(10),
  },
  modalButton: {
    paddingVertical: vs(8),
    paddingHorizontal: ms(15),
    borderRadius: ms(3),
    borderWidth: ms(2),
    borderColor: '#fff',
    minWidth: '45%',
    alignItems: 'center',
  },
  cancelButton: {
    borderColor: '#ff4d4d',
  },
  saveButton: {
    borderColor: '#00ff00',
  },
  modalButtonText: {
    fontFamily: FONT_FAMILY,
    fontSize: ms(10),
    color: '#fff',
  },
}); 