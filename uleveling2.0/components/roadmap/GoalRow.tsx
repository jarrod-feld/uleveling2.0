import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Barbell, Brain, Heartbeat, Handshake, Sparkle, Briefcase, Lightbulb } from 'phosphor-react-native';
import { scale as s, verticalScale as vS } from '@/constants/scaling';
import { Goal } from '@/mock/roadmapData';
import { StatCategory } from '@/components/roadmap/CategoryFilterNav';

const iconMap: Record<Exclude<StatCategory, 'ALL'>, React.ElementType> = {
  STR: Barbell,
  INT: Brain,
  VIT: Heartbeat,
  CHA: Handshake,
  DIS: Sparkle,
  CAR: Briefcase,
  CRE: Lightbulb,
};

interface GoalRowProps {
  goal: Goal;
  onPress: (goal: Goal) => void;
}

export default function GoalRow({ goal, onPress }: GoalRowProps) {
  const Icon = iconMap[goal.category] || Barbell;
  const iconSize = s(16);
  const iconColor = '#fff';

  return (
    <TouchableOpacity onPress={() => onPress(goal)} style={styles.row}>
      <Icon size={iconSize} color={iconColor} weight="bold" />
      <Text style={styles.txt} numberOfLines={2}>{goal.title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    paddingVertical: vS(10),
    paddingHorizontal: s(12),
    marginHorizontal: s(0),
    marginTop: vS(12),
    borderRadius: s(5),
    height: vS(70),
  },
  txt: {
    fontFamily: 'PressStart2P',
    fontSize: s(10),
    color: '#fff',
    marginLeft: s(10),
    flexShrink: 1
  }
}); 