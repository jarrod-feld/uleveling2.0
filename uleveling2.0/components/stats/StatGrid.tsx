import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Stat, STAT_ICONS } from '@/mock/statsData';
import { Info, ShareNetwork } from 'phosphor-react-native';
import { scale as s, verticalScale as vs, moderateScale as ms } from '@/constants/scaling';

const FONT_FAMILY = 'PressStart2P';
const STAT_SCALE_FACTOR = 0.9; // Factor to scale stat elements (0.9 = 90% of original)

// Define glow style properties
const glowStyle = {
  textShadowColor: 'rgba(255, 255, 255, 0.8)',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 5 * STAT_SCALE_FACTOR, // Scale glow radius
};

const iconGlowStyle = {
  shadowColor: "#fff",
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.8,
  shadowRadius: 4 * STAT_SCALE_FACTOR, // Scale glow radius
};

interface StatItemProps {
  item: Stat;
}

function StatItem({ item }: StatItemProps) {
  const IconComponent = STAT_ICONS[item.iconName];
  const bonusColor = '#00ff00';

  // Return tightly structured JSX
  return (
    <View style={styles.itemContainer}>{
      IconComponent ? (
        <View style={styles.iconWrapper}>
          <IconComponent size={ms(22 * STAT_SCALE_FACTOR)} color="#fff" weight="fill" />
        </View>
      ) : null
      }<Text style={styles.itemLabel}>{item.label}:</Text>{
      }<View style={styles.valueBonusContainer}>
        <Text style={styles.itemValue}>{item.totalValue}</Text>{
        item.bonus > 0 ? (
          <Text style={[styles.itemBonus, { color: bonusColor }]}>
            (+{item.bonus})
          </Text>
        ) : null
      }</View>
    </View>
  );
}

interface GridProps {
  data: Stat[];
}

export default function StatGrid({ data }: GridProps) {
  return (
    <View style={styles.gridContainer}>
      {/* Info Button - Use Fragment */}
      <Pressable style={styles.infoButton} onPress={() => console.log('Info pressed')}>
        <>
          {/* Scale icon size */}
           <Info size={ms(20 * STAT_SCALE_FACTOR)} color="#fff" weight="fill" />
        </>
      </Pressable>

      {/* Grid Content */}
      <View style={styles.gridContent}>
        {data.map((stat) => (
          <View key={stat.id} style={styles.gridItemWrapper}>
            <StatItem item={stat} />
          </View>
        ))}
      </View>

      {/* Share Button - Use Fragment */}
      <Pressable style={styles.shareButton} onPress={() => console.log('Share pressed')}>
         <>
           {/* Scale icon size */}
            <ShareNetwork size={ms(24 * STAT_SCALE_FACTOR)} color="#fff" weight="fill" />
         </>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    borderWidth: s(3),
    borderColor: '#fff',
    marginHorizontal: s(9),
    marginTop: vs(20),
    paddingHorizontal: s(10), // Adjust container padding for two columns
    paddingVertical: vs(35 * STAT_SCALE_FACTOR + 15),
    position: 'relative',
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 8,
    backgroundColor: '#0a192f',
  },
  gridContent: {
    flexDirection: 'row', // Back to row
    flexWrap: 'wrap', // Allow wrapping for two columns
    justifyContent: 'space-between', // Distribute space between columns
    // alignItems: 'flex-start', // Remove alignItems (default stretch or baseline is fine)
  },
  gridItemWrapper: {
    width: '50%', // Set back to 50% for two columns
    paddingHorizontal: s(5 * STAT_SCALE_FACTOR), // Add padding for spacing, scaled
    marginBottom: vs(15 * STAT_SCALE_FACTOR), // Restore vertical margin
    // Remove paddingLeft
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // If items in a column seem misaligned, might need fixed height or minHeight here
  },
   iconWrapper: {
    marginRight: s(8 * STAT_SCALE_FACTOR),
    ...iconGlowStyle,
  },
  itemLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: ms(11 * STAT_SCALE_FACTOR),
    color: '#fff',
    marginRight: s(1 * STAT_SCALE_FACTOR), // Significantly reduced margin
    ...glowStyle,
  },
  valueBonusContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end', // Keep as flex-end for subscript effect
    // Add a slight negative margin to pull bonus left if needed
    // marginLeft: -s(2), 
  },
  itemValue: {
    fontFamily: FONT_FAMILY,
    fontSize: ms(11 * STAT_SCALE_FACTOR), // Scale font size
    color: '#fff',
    marginRight: s(1 * STAT_SCALE_FACTOR), // Scale margin
    ...glowStyle,
  },
  itemBonus: {
    fontFamily: FONT_FAMILY,
    fontSize: ms(6 * STAT_SCALE_FACTOR), // Further reduced font size and scaled
    textShadowColor: 'rgba(0, 255, 0, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3 * STAT_SCALE_FACTOR, // Scale shadow radius
    // Make subscript effect more pronounced
    transform: [{ translateY: vs(3 * STAT_SCALE_FACTOR) }], // Apply scale to translation
    // No marginLeft needed, use container negative margin if needed
  },
  infoButton: {
    position: 'absolute',
    top: vs(8),
    right: s(8),
    padding: s(5),
  },
  shareButton: {
    position: 'absolute',
    bottom: vs(8),
    right: s(8),
    padding: s(5),
  },
}); 