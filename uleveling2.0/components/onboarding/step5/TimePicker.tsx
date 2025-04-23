import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import WheelPicker from '@quidone/react-native-wheel-picker';
import { scale, verticalScale, moderateScale } from '../../../constants/scaling';

// --- Picker Data ---
const HOURS = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
const PERIODS = ['AM', 'PM'];

const mapToPickerData = (arr: string[]) => arr.map(item => ({ value: item, label: item }));

const hourPickerData = mapToPickerData(HOURS);
const minutePickerData = mapToPickerData(MINUTES);
const periodPickerData = mapToPickerData(PERIODS);
// --------------------

interface TimePickerProps {
    hour: string;
    minute: string;
    period: string;
    onTimeChange: (part: 'hour' | 'minute' | 'period', value: string | undefined) => void;
}

const TimePicker: React.FC<TimePickerProps> = ({ hour, minute, period, onTimeChange }) => {

    // Reusable overlay renderer
    const renderPickerOverlay = () => {
        const itemHeight = verticalScale(30); // Keep original item height for time pickers
        const lineOffset = itemHeight / 2;

        return (
            <View style={styles.overlayContainer} pointerEvents="none">
                <View style={[styles.highlightLine, { bottom: lineOffset }]} />
                <View style={[styles.highlightLine, { top: lineOffset }]} />
            </View>
        );
    };

    return (
        <View style={styles.pickersRow}>
            {/* Hour Picker */}
            <View style={styles.pickerContainerSmall}>
                <WheelPicker
                    data={hourPickerData}
                    onValueChanged={({ item }) => onTimeChange('hour', item?.value)}
                    value={hour}
                    style={styles.pickerStyle}
                    itemHeight={verticalScale(30)}
                    itemTextStyle={styles.pickerItemText}
                  
                    renderOverlay={renderPickerOverlay}
                />
            </View>
            <Text style={styles.timeSeparator}>:</Text>
            {/* Minute Picker */}
            <View style={styles.pickerContainerSmall}>
                <WheelPicker
                    data={minutePickerData}
                    onValueChanged={({ item }) => onTimeChange('minute', item?.value)}
                    value={minute}
                    style={styles.pickerStyle}
                    itemHeight={verticalScale(30)}
                    itemTextStyle={styles.pickerItemText}
       
                    renderOverlay={renderPickerOverlay}
                />
            </View>
            {/* Period Picker */}
            <View style={styles.pickerContainerSmall}>
                <WheelPicker
                    data={periodPickerData}
                    onValueChanged={({ item }) => onTimeChange('period', item?.value)}
                    value={period}
                    style={styles.pickerStyle}
                    itemHeight={verticalScale(30)}
                    itemTextStyle={styles.pickerItemText}
                  
                    renderOverlay={renderPickerOverlay}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    pickersRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width:scale(50),
        marginTop: verticalScale(5),

    },
    pickerContainerSmall: {
        justifyContent: 'center',
        alignItems: 'center',
        height: verticalScale(30) * 4, // itemHeight * 5
        paddingHorizontal:scale(5)
    },
    pickerStyle: {
        width:"100%",
        height: '100%',
    },
    pickerItemText: {
        color: '#aaaaaa',
        fontSize: moderateScale(18, 0.4),
        textAlign: 'center',
    },
    pickerSelectedItemText: {
        color: '#ffffff',
        fontSize: moderateScale(22, 0.4),
        fontWeight: 'bold',
        textShadowColor: '#ffffff',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
        textAlign: 'center',
    },
    overlayContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    highlightLine: {
        position: 'absolute',
        left: scale(5),
        right: scale(5),
        height: moderateScale(1.5),
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
    timeSeparator: {
        color: '#e0e0e0',
        fontSize: moderateScale(20, 0.4),
        fontWeight: 'bold',
        marginHorizontal: scale(5),
        lineHeight: verticalScale(30), // Match itemHeight prop
    },
});

export default TimePicker;
