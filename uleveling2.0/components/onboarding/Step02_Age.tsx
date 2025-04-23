import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { scale, verticalScale, moderateScale } from '@/constants/scaling'; // Assuming this path is correct

// Define a shared interface for onboarding data (can be moved later)
interface OnboardingData {
    age?: number;
    // ... other fields will be added here
}

interface StepProps {
    onboardingData: OnboardingData;
    setOnboardingData: (updateFn: (prevData: OnboardingData) => OnboardingData) => void;
    // handleNext and handleBack are available but not directly used for validation logic here
    // isValid will be derived in the parent component based on onboardingData.age
}

const MIN_AGE = 13;
const MAX_AGE = 99;

export default function Step02_Age({ onboardingData, setOnboardingData }: StepProps) {
    const [selectedAge, setSelectedAge] = useState<number | undefined>(onboardingData.age);

    // Generate age options
    const ageOptions = Array.from({ length: MAX_AGE - MIN_AGE + 1 }, (_, i) => MIN_AGE + i);

    const handleSelectAge = (age: number) => {
        setSelectedAge(age);
        setOnboardingData(prevData => ({ ...prevData, age: age }));
    };

    // TODO: Implement a more visually appealing wheel/picker if possible
    // For now, using a simple scrollable list

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Select Your Age</Text>
            <View style={styles.pickerContainer}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    // Add snapping potentially? Needs more investigation for web compatibility.
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollViewContent}
                >
                    {ageOptions.map((age) => (
                        <TouchableOpacity
                            key={age}
                            onPress={() => handleSelectAge(age)}
                            style={[
                                styles.ageOption,
                                selectedAge === age && styles.selectedAgeOption,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.ageText,
                                    selectedAge === age && styles.selectedAgeText,
                                ]}
                            >
                                {age}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
             {/* Add NavRow space placeholder - actual NavRow rendered by parent */}
             <View style={styles.navPlaceholder} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1, // Occupy available space within SoloPopup
        alignItems: 'center',
        paddingHorizontal: moderateScale(20),
        paddingVertical: verticalScale(20), // Inner padding PAD_V
    },
    title: {
        fontSize: moderateScale(20),
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: verticalScale(25),
        fontFamily: 'PublicSans-Bold', // Assuming bold weight exists
    },
    pickerContainer: {
        height: verticalScale(200), // Fixed height for the picker area
        width: '50%', // Adjust width as needed
        borderWidth: 1,
        borderColor: '#555555', // Example border
        borderRadius: moderateScale(10),
        overflow: 'hidden', // Ensure scroll content stays within bounds
        marginBottom: verticalScale(20),
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        alignItems: 'center', // Center items horizontally
        paddingVertical: verticalScale(80), // Padding to center initial view
    },
    ageOption: {
        paddingVertical: verticalScale(8),
        width: '100%',
        alignItems: 'center',
    },
    selectedAgeOption: {
        // Add subtle background highlight if needed
        // backgroundColor: 'rgba(0, 255, 0, 0.1)',
    },
    ageText: {
        fontSize: moderateScale(22),
        color: '#ffffff',
        fontFamily: 'PublicSans-Regular',
    },
    selectedAgeText: {
        color: '#00ff00', // Highlight selected age
        fontWeight: 'bold',
        fontFamily: 'PublicSans-Bold',
    },
    navPlaceholder: {
         // Ensure there's space for NavRow, adjust height as needed
         height: verticalScale(60),
    },
}); 