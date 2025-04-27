import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Stat, STAT_ICONS } from '@/mock/statsData';
import { Info, ShareNetwork } from 'phosphor-react-native';
import { scale as s, verticalScale as vs, moderateScale as ms } from '@/constants/scaling';

const FONT_FAMILY = 'PressStart2P';

interface StatItemProps {
  item: Stat;
}

function StatItem({ item }: StatItemProps) {
  const IconComponent = STAT_ICONS[item.iconName];
  return (
    <View style={styles.itemContainer}>
      {IconComponent && <IconComponent size={ms(20)} color="#fff" weight="fill" />} 
      <Text style={styles.itemLabel}>{item.label}:</Text>
      <Text style={styles.itemValue}>{item.value}</Text>
      {item.bonus !== undefined && (
        <Text style={styles.itemBonus}>(+{item.bonus})</Text>
      )}
    </View>
  );
}

interface GridProps {
  data: Stat[];
}

export default function StatGrid({ data }: GridProps) {
  return (
    <View style={styles.gridContainer}>
      {/* Info Button */}
      <Pressable style={styles.infoButton} onPress={() => console.log('Info pressed')}>
        <Info size={ms(20)} color="#fff" weight="fill" />
      </Pressable>
      
      {/* Grid Content */}
      <View style={styles.gridContent}>
        {data.map((stat) => (
          <View key={stat.id} style={styles.gridItemWrapper}>
            <StatItem item={stat} />
          </View>
        ))}
      </View>

      {/* Share Button */}
      <Pressable style={styles.shareButton} onPress={() => console.log('Share pressed')}>
        <ShareNetwork size={ms(24)} color="#fff" weight="fill" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    borderWidth: s(3),
    borderColor: '#fff',
    marginHorizontal: s(20),
    marginTop: vs(20),
    paddingHorizontal: s(10),
    paddingTop: vs(30), // Space for info button
    paddingBottom: vs(40), // Space for share button
    position: 'relative', // Needed for absolute positioning of buttons
  },
  gridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between', // Adjust as needed
  },
  gridItemWrapper: {
    width: '48%', // Roughly half width for 2 columns, adjust as needed
    marginBottom: vs(15),
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: ms(10),
    color: '#fff',
    marginLeft: s(8),
  },
  itemValue: {
    fontFamily: FONT_FAMILY,
    fontSize: ms(10),
    color: '#fff',
    marginLeft: s(4),
  },
  itemBonus: {
    fontFamily: FONT_FAMILY,
    fontSize: ms(9),
    color: '#00ff00', // Green color for bonus
    marginLeft: s(5),
  },
  infoButton: {
    position: 'absolute',
    top: vs(5),
    right: s(5),
    padding: s(5),
  },
  shareButton: {
    position: 'absolute',
    bottom: vs(5),
    right: s(5),
    padding: s(5),
  },
}); 