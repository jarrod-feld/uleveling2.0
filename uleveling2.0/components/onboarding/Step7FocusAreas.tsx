import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Button, ScrollView, TextInput, StyleSheet } from 'react-native';
import { OnboardingData } from '../../app/onboarding'; // Adjust path
import { scale, verticalScale, moderateScale } from '../../constants/scaling';

interface Step7FocusAreasProps {
  onboardingData: OnboardingData;
  setOnboardingData: React.Dispatch<React.SetStateAction<OnboardingData>>;
  toggleFocusArea: (area: string) => void;
  handleNext: () => void;
  DEFAULT_FOCUS_AREAS: string[];
}

const Step7FocusAreas: React.FC<Step7FocusAreasProps> = ({
  onboardingData,
  setOnboardingData,
  toggleFocusArea,
  handleNext,
  DEFAULT_FOCUS_AREAS,
}) => {
  const [newFocusArea, setNewFocusArea] = useState('');

  const handleAddFocusArea = () => {
    const trimmedArea = newFocusArea.trim();
    if (trimmedArea && !onboardingData.focusAreas.includes(trimmedArea)) {
      setOnboardingData(prev => ({ ...prev, focusAreas: [...prev.focusAreas, trimmedArea] }));
      setNewFocusArea(''); // Clear input after adding
    }
  };

  return (
    <View style={styles.contentWrapper}>
      <Text style={styles.labelText}>Select Focus Areas:</Text>
      <Text style={styles.subLabelText}>(Choose up to 3)</Text>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.buttonContainer}>
        {[...DEFAULT_FOCUS_AREAS, ...onboardingData.focusAreas.filter(area => !DEFAULT_FOCUS_AREAS.includes(area))].map((area) => (
          <TouchableOpacity
            key={area}
            style={[
              styles.focusButton,
              onboardingData.focusAreas.includes(area) && styles.focusButtonSelected,
              onboardingData.focusAreas.length >= 3 && !onboardingData.focusAreas.includes(area) && styles.focusButtonDisabled
            ]}
            onPress={() => toggleFocusArea(area)}
            disabled={onboardingData.focusAreas.length >= 3 && !onboardingData.focusAreas.includes(area)}
          >
            <Text style={styles.focusButtonText}>{area}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.addAreaContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add custom focus area..."
          placeholderTextColor="#888888" // Darker grey placeholder
          value={newFocusArea}
          onChangeText={setNewFocusArea}
          returnKeyType="done"
          onSubmitEditing={handleAddFocusArea}
        />
        <TouchableOpacity 
          style={[styles.addButton, !newFocusArea.trim() && styles.addButtonDisabled]}
          onPress={handleAddFocusArea} 
          disabled={!newFocusArea.trim()}
        >
           <Text style={styles.addButtonText}>+</Text>
         </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  contentWrapper: {
    
    width: '100%',
    alignItems: 'center',
    paddingVertical: verticalScale(10),
  },
  labelText: {
    color: '#cccccc', // Lighter grey
    fontSize: moderateScale(16, 0.3), // Smaller font size
    marginBottom: verticalScale(5), // Reduced margin
    fontWeight: 'normal', // Normal weight
    textAlign: 'center',
    textShadowColor: 'rgba(204, 204, 204, 0.6)', // Dimmer shadow
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6, // Reduced radius
    // Removed textTransform and letterSpacing
  },
  subLabelText: {
    color: '#bbbbbb', // Lighter grey
    fontSize: moderateScale(14, 0.3),
    marginBottom: verticalScale(20),
    textAlign: 'center',
  },
  scrollView: {
    width: '95%',
    flexGrow: 0,
    maxHeight: verticalScale(150),
    marginBottom: verticalScale(20),
  },
  buttonContainer: {
    flexDirection: 'row', 
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: scale(5),
  },
  focusButton: {
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(15),
    backgroundColor: 'transparent', // Removed background

    borderWidth: moderateScale(1),
    borderColor: '#aaaaaa', // Grey border
    margin: scale(5),
    shadowColor: '#ffffff', // White shadow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7, // Increased opacity
    shadowRadius: 5, // Increased radius
    elevation: 6, // Increased elevation
  },
  focusButtonSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Very subtle white highlight
    borderColor: '#ffffff', // White border
    shadowOpacity: 1.0, // Increased opacity
    shadowRadius: 10, // Increased radius
    elevation: 12, // Increased elevation
  },
  focusButtonDisabled: {
    backgroundColor: 'transparent', // Removed background
    borderColor: '#555',
    shadowOpacity: 0,
    elevation: 0,
  },
  focusButtonText: {
    color: '#ffffff', // Changed to white
    fontSize: moderateScale(14, 0.3),
    fontWeight: 'bold',
    textShadowColor: '#ffffff', // Changed to white
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8, // Increased radius
  },
  addAreaContainer: {
    flexDirection: 'row',
    width: '95%',
    marginTop: verticalScale(10),
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginRight: scale(10),
    backgroundColor: 'rgba(30, 30, 30, 0.8)', // Darker input background
    color: '#fff',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(15),
    fontSize: moderateScale(15, 0.4),
    borderRadius: moderateScale(5),
    textAlign: 'left',
    borderWidth: moderateScale(0.5),
    borderColor: 'rgba(255, 255, 255, 0.2)', // Faint white border
  },
  addButton: { 
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(15),
    backgroundColor: 'transparent', // Removed background
    borderRadius: moderateScale(5),
    borderWidth: moderateScale(1),
    borderColor: '#cccccc', // Light grey border
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ffffff', // White shadow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9, // Increased opacity
    shadowRadius: 8, // Increased radius
    elevation: 10, // Increased elevation
  },
  addButtonDisabled: {
    backgroundColor: 'transparent', // Removed background
    borderColor: '#555',
    shadowOpacity: 0,
    elevation: 0,
  },
  addButtonText: {
    color: '#ffffff', // Changed to white
    fontSize: moderateScale(20, 0.4),
    fontWeight: 'bold',
    textShadowColor: '#ffffff', // Changed to white
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8, // Increased radius
  },
  checkboxContainer: {
    width: '100%',
    borderWidth: moderateScale(1),
    borderColor: '#00ffff',
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(12),
    backgroundColor: 'transparent', // Removed background
  },
  checkboxLabel: {
    color: '#fff',
    fontSize: moderateScale(16, 0.4),
    textAlign: 'center',
    fontFamily: 'PublicSans-Regular', // Add font family
  },
  otherInput: {
    borderWidth: moderateScale(1),
    textAlign: 'center',
    fontSize: moderateScale(16, 0.4),
    borderRadius: moderateScale(5),
    fontFamily: 'PublicSans-Regular', // Add font family
  },
});

export default Step7FocusAreas;