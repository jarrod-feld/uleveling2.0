import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { verticalScale as vScale, moderateScale as ms, scale as s } from '@/constants/scaling';
import { useAuth } from '@/contexts/UserContext'; // Import useAuth to access context
import SoloPopup from '@/components/common/SoloPopup'; // Import SoloPopup

const FONT_FAMILY = 'PressStart2P';
const POPUP_HEIGHT = vScale(135); // Define required height here

// No props needed now, as it gets state from context
// interface NewTitleNotificationPopupProps {}

export default function NewTitleNotificationPopup() {
  // Get state and close function from context
  const { newTitlePopupState, closeNewTitlePopup } = useAuth();

  // Don't render anything if not visible (SoloPopup handles visibility internally too, but this prevents unnecessary rendering)
  if (!newTitlePopupState.visible) {
      return null;
  }

  return (
    <SoloPopup
        visible={newTitlePopupState.visible} // Controlled by context
        onClose={closeNewTitlePopup} // Backdrop press closes
        requiredHeight={POPUP_HEIGHT}
    >
        {/* Content that goes inside SoloPopup's animated panel */}
        <View style={styles.popupContent}>
            <Text style={styles.popupTitle}>New Title Unlocked!</Text>
            <Text style={styles.popupBody}>You can now equip the title:</Text>
            <Text style={styles.popupTitleName}>{newTitlePopupState.titleName ?? 'Unknown Title'}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={closeNewTitlePopup}>
                <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
        </View>
    </SoloPopup>
  );
}

// Styles for the *content* inside the popup
const styles = StyleSheet.create({
    popupContent: { // Styles the <View> passed as children to SoloPopup
        flex: 1,
        width: '100%',
        justifyContent: 'center', // Centers content vertically within the panel
        alignItems: 'center',     // Centers content horizontally within the panel
        paddingVertical: vScale(10),
    },
    popupTitle: {
        fontFamily: FONT_FAMILY,
        fontSize: ms(14),
        color: '#ccd6f6',
        marginBottom: vScale(8),
        textAlign: 'center',
    },
    popupBody: {
        fontFamily: 'System',
        fontSize: ms(12),
        color: '#a8b2d1',
        marginBottom: vScale(10),
        textAlign: 'center',
        paddingHorizontal: s(10),
    },
    popupTitleName: {
        fontFamily: FONT_FAMILY,
        fontSize: ms(16),
        color: '#64ffda',
        textAlign: 'center',
        marginBottom: vScale(15),
    },
    closeButton: {
        backgroundColor: '#112240',
        paddingVertical: vScale(8),
        paddingHorizontal: s(15),
        borderRadius: s(5),
        borderWidth: 1,
        borderColor: '#64ffda',
    },
    closeButtonText: {
        fontFamily: FONT_FAMILY,
        color: '#64ffda',
        fontSize: ms(10),
    },
}); 