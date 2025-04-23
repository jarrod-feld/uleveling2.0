import React, { useState, useEffect } from 'react';
// Import Image from react-native as RNImage to resolve assets
import { View, Text, StyleSheet, Button, TextInput, TouchableOpacity, Platform, ScrollView, Keyboard, KeyboardAvoidingView, Image as RNImage, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import OnboardingPopup from '@/components/OnboardingPopup'; // Adjust path as needed
// Corrected import path if needed, assuming standard installation
// @ts-ignore - Temporarily ignore type import issue
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { scale, verticalScale, moderateScale } from '@/constants/scaling'; // Use path alias
import { Image } from 'expo-image'; // Import Image from expo-image

// Import Step Components
import Step1Welcome from '@/components/onboarding/Step1Welcome';
import Step2Age from '@/components/onboarding/Step2Age';
import Step3Gender from '@/components/onboarding/Step3Gender';
import Step4LifeStatus from '@/components/onboarding/Step4LifeStatus';
import Step5SleepSchedule from '@/components/onboarding/Step5SleepSchedule';
import Step6WorkSchoolHours from '@/components/onboarding/Step6WorkSchoolHours';
import Step7FocusAreas from '@/components/onboarding/Step7FocusAreas';
import Step8RoadmapChoice from '@/components/onboarding/Step8RoadmapChoice';
import Step9GoalsOrTemplate from '@/components/onboarding/Step9GoalsOrTemplate';
import Step10SignIn from '@/components/onboarding/Step10SignIn';
import Step11FoundUs from '@/components/onboarding/Step11FoundUs';
import Step12Rating from '@/components/onboarding/Step12Rating';
import Step13Paywall from '@/components/onboarding/Step13Paywall';
import SoloPopup from '@/components/popup/SoloPopup';
import NavRow from '@/components/popup/Navbar';

// Define types for the onboarding data
// Export Goal type
export type Goal = {
    id: string; // Unique ID for list key
    description: string;
    timeframe: string; // e.g., '3 months', '1 year'
};
function TitleBar({ text }: { text: string }) {
    return (
      <View style={{ marginBottom: verticalScale(20), alignItems: 'center' }}>
        <Text
          style={{
            color: '#fff',
            fontSize: moderateScale(18, 0.4),
            fontWeight: 'bold',
            letterSpacing: 1,
            textShadowColor: '#fff',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 8,
            fontFamily: 'PublicSans-Bold',
          }}
        >
          {text.toUpperCase()}
        </Text>
      </View>
    );
  }
  
// Export the type
export type OnboardingData = {
    age: string | null;
    gender: string | null;
    lifeStatus: {
        working: boolean;
        school: boolean;
    };
    sleepWakeTime: { wake: Date | null; sleep: Date | null };
    workSchoolHours: { work: string | null; school: string | null };
    focusAreas: string[];
    otherFocusArea: string | null;
    roadmapChoice: 'create' | 'template' | null;
    goals: Goal[];
    templateChoice: string | null; // e.g., 'Balanced Growth', 'Fitness Focus'
    templateIntensity: 'low' | 'medium' | 'high' | null;
    // Step 10 (New): Sign in status - might not be stored here long-term
    isSignedIn: boolean;
    // Step 11 (Old 10)
    foundUsSource: string | null;
    otherFoundUsSource: string | null;
    // Step 12 (Old 11)
    rating: number | null;
    // Step 13 (Old 12): Paywall - handled by navigation/screen change
};

// Default focus areas
const DEFAULT_FOCUS_AREAS = [
    'Dating',
    'Social Life',
    'Health and Fitness',
    'Career',
    'Academics',
];

const AGE_OPTIONS = Array.from({ length: 87 }, (_, i) => (i + 13).toString()); // Ages 13-99

// Image paths used in OnboardingPopup - ADD ALL IMAGES HERE
const popupImages = [
    require('@/assets/images/techno-border-top.png'),
    require('@/assets/images/techno-background.gif'), // Inner GIF
    require('@/assets/images/techno-border-bottom.png'),
    require('@/assets/images/techno-background-wide.png'), // Outer background
];

export default function OnboardingScreen() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [showPopup, setShowPopup] = useState(false); // Control initial popup animation
    
    // Delay showing popup to allow black screen
    useEffect(() => {
      const timeout = setTimeout(() => setShowPopup(true), 1000);
      return () => clearTimeout(timeout);
    }, []);
    const [onboardingData, setOnboardingData] = useState<OnboardingData>({
        age: null,
        gender: null,
        lifeStatus: { working: false, school: false },
        sleepWakeTime: { wake: null, sleep: null },
        workSchoolHours: { work: null, school: null },
        focusAreas: [],
        otherFocusArea: null,
        roadmapChoice: null,
        goals: [],
        templateChoice: null,
        templateIntensity: null,
        isSignedIn: false, // Assume not signed in initially
        foundUsSource: null,
        otherFoundUsSource: null,
        rating: null,
    });

    // Initialize sleep/wake times on mount
    useEffect(() => {
        if (onboardingData.sleepWakeTime.wake === null && onboardingData.sleepWakeTime.sleep === null) {
            const initialWake = new Date();
            initialWake.setHours(7, 0, 0, 0); // Default 7:00 AM
            const initialSleep = new Date();
            initialSleep.setHours(22, 0, 0, 0); // Default 10:00 PM
            setOnboardingData(prev => ({
                ...prev,
                sleepWakeTime: { wake: initialWake, sleep: initialSleep }
            }));
        }
    }, []); // Run only once on mount

    const totalSteps = 14; // Updated total steps (13 content + 1 final navigation)

    const handleNext = () => {
        if (currentStep < totalSteps -1) { // Go up to step 13 (Paywall)
             // Skip step 6 if user is neither working nor in school
            if (currentStep === 5 && !onboardingData.lifeStatus.working && !onboardingData.lifeStatus.school) {
                 setCurrentStep(7);
            }
            // Skip step 9 variation handled by component logic
            else if (currentStep === 8) {
                 setCurrentStep(currentStep + 1); // Go to step 9
            } else {
                 setCurrentStep(currentStep + 1);
            }
        } else {
            // Navigate to dashboard after the last content step (Paywall)
            router.replace('/(tabs)'); // Use the group route name directly
        }
    };

    // Function to handle going back a step
    const handleBack = () => {
        if (currentStep === 1) {
            // Exit the app if on the first step
            BackHandler.exitApp();
        } else if (currentStep > 1) {
            // Handle skipping step 6 when going back
            if (currentStep === 7 && !onboardingData.lifeStatus.working && !onboardingData.lifeStatus.school) {
                 setCurrentStep(5);
            } else {
                 setCurrentStep(currentStep - 1);
            }
        }
        // Optional: Handle back from first step logic removed as it's handled above
    };

    // Helper function to determine if Next button should be disabled
    const calculateIsNextDisabled = (): boolean => {
        switch (currentStep) {
            case 1: return false; 
            case 2: return false; // Always enable Next for Age picker
            case 3: return !onboardingData.gender;
            case 4: return !onboardingData.lifeStatus.working && !onboardingData.lifeStatus.school;
            case 5: return false; // Always enable Next for Sleep picker
            case 6:
                 const workHoursMissing = onboardingData.lifeStatus.working && !onboardingData.workSchoolHours.work;
                 const schoolHoursMissing = onboardingData.lifeStatus.school && !onboardingData.workSchoolHours.school;
                 return workHoursMissing || schoolHoursMissing;
            case 7: return onboardingData.focusAreas.length === 0 || (onboardingData.focusAreas.includes('Other') && !onboardingData.otherFocusArea?.trim());
            case 8: return !onboardingData.roadmapChoice;
            case 9:
                if (onboardingData.roadmapChoice === 'create') {
                    return onboardingData.goals.length === 0;
                } else if (onboardingData.roadmapChoice === 'template') {
                    return !onboardingData.templateChoice || !onboardingData.templateIntensity;
                }
                return true; // Should not happen
            case 10: return !onboardingData.isSignedIn; // Depends on how sign-in state is managed
            case 11: return !onboardingData.foundUsSource || (onboardingData.foundUsSource === 'Other' && !onboardingData.otherFoundUsSource?.trim());
            case 12: return onboardingData.rating === null;
            case 13: return false; // Paywall step might always allow proceeding (to skip or pay)
            default: return true; // Disable for unknown steps or step 1
        }
    };

    const handleClosePopup = () => {
        handleNext();
    };

    // Helper functions passed as props
    const toggleLifeStatus = (key: 'working' | 'school') => {
        setOnboardingData((prevData) => {
            const isCurrentlySelected = prevData.lifeStatus[key];
            const newLifeStatus = { ...prevData.lifeStatus, [key]: !isCurrentlySelected };
            const hoursKey = key === 'working' ? 'work' : 'school';
            const newWorkSchoolHours = {
                ...prevData.workSchoolHours,
                [hoursKey]: isCurrentlySelected ? null : prevData.workSchoolHours[hoursKey],
            };
            return {
                ...prevData,
                lifeStatus: newLifeStatus,
                workSchoolHours: newWorkSchoolHours,
            };
        });
    };

    const toggleFocusArea = (area: string) => {
        setOnboardingData((prevData) => {
            const updatedAreas = prevData.focusAreas.includes(area)
                ? prevData.focusAreas.filter((a) => a !== area)
                : [...prevData.focusAreas, area];
             // Also handle clearing 'other' if 'Other' is deselected implicitly
             const otherFocusCleared = !updatedAreas.includes('Other') ? null : prevData.otherFocusArea;
            return { ...prevData, focusAreas: updatedAreas, otherFocusArea: otherFocusCleared };
        });
    };

    const addGoal = (description: string, timeframe: string) => {
        if (description.trim() && timeframe.trim()) {
            const newGoal: Goal = {
                id: Date.now().toString(),
                description: description.trim(),
                timeframe: timeframe.trim(),
            };
            setOnboardingData((prevData) => ({
                ...prevData,
                goals: [...prevData.goals, newGoal],
            }));
        }
    };

    const removeGoal = (id: string) => {
        setOnboardingData((prevData) => ({
            ...prevData,
            goals: prevData.goals.filter((goal) => goal.id !== id),
        }));
    };

     const selectFoundUsSource = (source: string) => {
        const isOther = source === 'Other';
        setOnboardingData(prevData => ({
            ...prevData,
            foundUsSource: isOther ? 'Other' : source,
            // Clear other text if a non-'Other' source is selected
            otherFoundUsSource: source !== 'Other' ? null : prevData.otherFoundUsSource,
        }));
        // Local state in Step11 component handles showing/hiding the input now
    };

    const selectRating = (rating: number) => {
        setOnboardingData(prevData => ({ ...prevData, rating }));
        handleNext(); // Move to next step immediately after rating
    };

    const handleAppleSignIn = () => {
        console.log("Apple Sign In Tapped");
        setOnboardingData(prevData => ({ ...prevData, isSignedIn: true }));
        handleNext();
    };

    const handleGoogleSignIn = () => {
        console.log("Google Sign In Tapped");
        setOnboardingData(prevData => ({ ...prevData, isSignedIn: true }));
        handleNext();
    };
    // --- End Helper Functions ---

    // Refactored renderStepContent to use imported components
    const renderStepContent = () => {
        const commonProps = {
            onboardingData,
            setOnboardingData,
            handleNext,
            handleBack, // Pass handleBack down
        };

        switch (currentStep) {
            case 1:
                return <Step1Welcome handleNext={handleNext} />; // No back button on step 1
            case 2:
                return <Step2Age {...commonProps} AGE_OPTIONS={AGE_OPTIONS} />; // Pass handleBack
            case 3:
                return <Step3Gender {...commonProps} />; // Pass handleBack
            case 4:
                return <Step4LifeStatus {...commonProps} toggleLifeStatus={toggleLifeStatus} />; // Pass handleBack
            case 5:
                return <Step5SleepSchedule {...commonProps} />; // Pass handleBack
            case 6:
                return <Step6WorkSchoolHours {...commonProps} />; // Pass handleBack
            case 7:
                return <Step7FocusAreas {...commonProps} DEFAULT_FOCUS_AREAS={DEFAULT_FOCUS_AREAS} toggleFocusArea={toggleFocusArea} />; // Pass handleBack
            case 8:
                return <Step8RoadmapChoice {...commonProps} />; // Pass handleBack
            case 9:
                return <Step9GoalsOrTemplate 
                          {...commonProps} 
                          addGoal={addGoal} 
                          removeGoal={removeGoal} 
                       />; // Pass handleBack
            case 10:
                return <Step10SignIn {...commonProps} handleAppleSignIn={handleAppleSignIn} handleGoogleSignIn={handleGoogleSignIn} />; // Pass handleBack
            case 11:
                return <Step11FoundUs {...commonProps} selectFoundUsSource={selectFoundUsSource} />; // Pass handleBack
            case 12:
                return <Step12Rating {...commonProps} selectRating={selectRating} />; // Pass handleBack
            case 13:
                return <Step13Paywall {...commonProps} />; // Pass handleBack
            default:
                // Return a fallback or null for safety
                return <Text style={styles.popupText}>Loading step...</Text>;
        }
    };

    const getStepTitle = () => {
        switch (currentStep) {
            case 1: return "NOTIFICATION";
            case 2: return "What is your age?";
            case 3: return "What is your Gender?";
            case 4: return "Commitments";
            case 5: return "Sleep Schedule";
            case 6: return "Daily Time Commitment";
            case 7: return "Focus Areas";
            case 8: return "Create Your Roadmap";
            case 9: return onboardingData.roadmapChoice === 'create' ? "Create Goals" : "Select Template";
            case 10: return "Account Setup";
            case 11: return "How Did You Find Us?";
            case 12: return "Quick Rating";
            case 13: return "Unlock Premium";
            default: return "Onboarding";
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingContainer}
        >
            <View style={[styles.container, { backgroundColor: showPopup ? '#050a15' : '#000000' }]}>
                
                <View style={styles.preloadContainer}>
                    {popupImages.map((imgSrc, index) => (
                        <Image key={index} source={imgSrc} style={styles.preloadImage} />
                    ))}
                </View>

                /* --------- AFTER --------- */
                <SoloPopup visible={showPopup} onClose={() => setShowPopup(false)}>
  <TitleBar text={getStepTitle()} />

  {renderStepContent()}

  <NavRow
    currentStep={currentStep}
    totalSteps={14}              // 13 content steps + paywall
    onBack={handleBack}
    onNext={handleNext}
    nextDisabled={calculateIsNextDisabled()}
  />
</SoloPopup>

            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    keyboardAvoidingContainer: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: 'red',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: moderateScale(20),
      },
      // Styles for invisible image preloading
      preloadContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 1,
        height: 1,
        opacity: 0,
        zIndex: -1, // Ensure it's behind everything
        
      },
      preloadImage: {
        width: 1,
        height: 1,
      },
      popupText: {
        color: '#e0e0e0',
        fontSize: moderateScale(18, 0.4),
        textAlign: 'center',
        marginHorizontal: scale(20),
        lineHeight: verticalScale(24),
        fontFamily: 'PublicSans-Regular',
      },
      tapToContinue: {
        color: '#00aaaa',
        fontSize: moderateScale(14, 0.3),
        marginTop: verticalScale(15),
        fontFamily: 'PublicSans-Regular',
      },
      inputContainer: {
      
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: scale(15),
        paddingVertical: verticalScale(20),
        justifyContent: 'space-between',
      },
      labelText: {
        color: '#e0e0e0',
        fontSize: moderateScale(18, 0.4),
        marginBottom: verticalScale(15),
        fontWeight: 'bold',
        textAlign: 'center',
        fontFamily: 'PublicSans-Bold',
      },
      input: {
        borderWidth: moderateScale(1),
        borderColor: '#00ffff',
        backgroundColor: 'rgba(0, 50, 70, 0.5)',
        color: '#fff',
        paddingVertical: verticalScale(12),
        paddingHorizontal: scale(15),
        marginBottom: verticalScale(25),
        width: '90%',
        textAlign: 'center',
        fontSize: moderateScale(16, 0.4),
        borderRadius: moderateScale(5),
        fontFamily: 'PublicSans-Regular',
      },
      inputSmall: {
        borderWidth: moderateScale(1),
        borderColor: '#00ffff',
        backgroundColor: 'rgba(0, 50, 70, 0.5)',
        color: '#fff',
        paddingVertical: verticalScale(8),
        paddingHorizontal: scale(10),
        width: scale(80),
        textAlign: 'center',
        fontSize: moderateScale(16, 0.4),
        borderRadius: moderateScale(5),
        fontFamily: 'PublicSans-Regular',
      },
      inputGroup: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '70%',
          marginBottom: verticalScale(20),
      },
      inputLabel: {
          color: '#ccc',
          fontSize: moderateScale(16, 0.4),
          marginRight: scale(10),
          fontFamily: 'PublicSans-Regular',
      },
      buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        width: '100%',
        marginTop: verticalScale(10),
        marginBottom: verticalScale(10),
      },
      buttonColumn: {
          width: '80%',
          alignItems: 'stretch',
          marginTop: verticalScale(20),
          marginBottom: verticalScale(20),
      },
      scrollViewOptions: {
          width: '90%',
          maxHeight: verticalScale(250),
          marginBottom: verticalScale(20),
      },
      checkboxContainer: {
        width: '90%',
        marginBottom: verticalScale(30),
        alignItems: 'center',
      },
      checkboxBase: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: verticalScale(12),
        paddingHorizontal: scale(20),
        borderWidth: moderateScale(1),
        borderColor: '#00ffff',
        borderRadius: moderateScale(8),
        marginBottom: verticalScale(12),
        backgroundColor: 'transparent',
        width: '100%',
      },
      checkboxChecked: {
        backgroundColor: 'rgba(0, 255, 255, 0.3)',
        borderColor: '#00dddd',
      },
      checkboxLabel: {
        color: '#fff',
        fontSize: moderateScale(16, 0.4),
        textAlign: 'center',
        fontFamily: 'PublicSans-Regular',
      },
      timePickerSection: {
        width: '95%',
        alignItems: 'center',
        marginBottom: verticalScale(5),
      },
      timePickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: verticalScale(2),
      },
      timeSeparator: {
        color: '#e0e0e0',
        fontSize: moderateScale(20, 0.4),
        fontWeight: 'bold',
        marginHorizontal: scale(3),
      },
      pickerContainer: { // Style for Age picker
        height: verticalScale(120),
        width: '60%',
        marginBottom: verticalScale(20),
      },
      pickerItemText: { // Style for all picker items (non-selected)
        fontSize: moderateScale(18, 0.4),
        color: '#aaa',
        fontFamily: 'PublicSans-Regular',
      },
      pickerActiveItemText: { // Style for all picker items (selected)
        fontSize: moderateScale(20, 0.4),
        color: '#fff',
        fontWeight: 'bold',
        fontFamily: 'PublicSans-Bold',
      },
      goalInputRow: {
        flexDirection: 'row',
        width: '95%',
        marginBottom: verticalScale(15),
    },
    scrollViewGoals: {
        width: '95%',
        maxHeight: verticalScale(150),
        marginBottom: verticalScale(15),
        marginTop: verticalScale(15),
        borderWidth: moderateScale(1),
        borderColor: '#005566',
        borderRadius: moderateScale(5),
        padding: scale(5),
    },
    goalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'transparent',
        paddingVertical: verticalScale(8),
        paddingHorizontal: scale(12),
        borderRadius: moderateScale(4),
        marginBottom: verticalScale(8),
        borderWidth: 1,
        borderColor: 'rgba(0, 80, 100, 0.6)',
    },
     goalTextContainer: {
         flex: 1,
         marginRight: scale(10),
     },
     goalTextDesc: {
         color: '#fff',
         fontSize: moderateScale(14, 0.3),
         fontFamily: 'PublicSans-Regular',
     },
     goalTextTime: {
         color: '#aaa',
         fontSize: moderateScale(12, 0.3),
         marginTop: verticalScale(2),
         fontFamily: 'PublicSans-Regular',
     },
     removeGoalButton: {
         padding: scale(5),
         marginLeft: scale(5),
         backgroundColor: 'transparent',
     },
     removeGoalText: {
         color: '#ff4444',
         fontWeight: 'bold',
         fontSize: moderateScale(16, 0.4),
         fontFamily: 'PublicSans-Bold',
     },
     placeholderText: {
         color: '#888',
         textAlign: 'center',
         marginTop: verticalScale(20),
         fontStyle: 'italic',
         fontFamily: 'PublicSans-Regular',
     },
     ratingButton: {
         borderWidth: moderateScale(1),
         borderColor: '#00ffff',
         width: scale(40),
         height: scale(40),
         borderRadius: scale(20),
         justifyContent: 'center',
         alignItems: 'center',
         backgroundColor: 'transparent'
     },
     ratingButtonText: {
         color: '#00ffff',
         fontSize: moderateScale(16, 0.4),
         fontWeight: 'bold',
         fontFamily: 'PublicSans-Bold',
     },
});