import React from 'react';
import { ScrollView, Text, StyleSheet, Pressable, View } from 'react-native';
import { scale as s, verticalScale as vs, moderateScale as ms } from '@/constants/scaling';

const FONT_FAMILY = 'PressStart2P';
const CATEGORIES = ['ALL', 'STR', 'INT', 'VIT', 'CHA', 'DIS', 'CAR', 'CRE'] as const;
export type StatCategory = typeof CATEGORIES[number];

interface CategoryFilterNavProps {
  filter: StatCategory;
  onChange: (category: StatCategory) => void;
}

export default function CategoryFilterNav({ filter, onChange }: CategoryFilterNavProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map((category) => (
          <Pressable
            key={category}
            style={[styles.button, filter === category && styles.activeButton]}
            onPress={() => onChange(category)}
          >
            <Text style={[styles.buttonText, filter === category && styles.activeButtonText]}>
              {category}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: vs(40), // Adjust height as needed
    marginTop: vs(15),
    marginBottom: vs(5),
    paddingLeft: s(20), // Match page padding
  },
  scrollContent: {
    alignItems: 'center',
    paddingRight: s(20), // Ensure last item has padding
  },
  button: {
    paddingVertical: vs(6),
    paddingHorizontal: s(12),
    borderRadius: s(15),
    borderWidth: s(1.5),
    borderColor: '#fff',
    backgroundColor: 'transparent',
    marginRight: s(10),
    justifyContent: 'center',
    alignItems: 'center',
    height: vs(30),
  },
  activeButton: {
    backgroundColor: '#fff',
  },
  buttonText: {
    fontFamily: FONT_FAMILY,
    fontSize: ms(10),
    color: '#fff',
  },
  activeButtonText: {
    color: '#000', // Adjust active text color as needed
  },
}); 