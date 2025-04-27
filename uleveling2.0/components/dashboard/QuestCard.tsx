import React from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Barbell, Brain, Heart, Plus, Minus, Check, X, CheckSquare, XSquare, ArrowULeftUp } from 'phosphor-react-native';
import { scale as s, verticalScale as vs } from '@/constants/scaling';
import { Quest as QuestData } from '@/mock/dashboardData'; // Rename import to avoid conflict

const ICONS = { dumbbell: Barbell, brain: Brain, heart: Heart } as const;
const COLOR = {
  bg       : '#002A35',
  white    : '#ffffff',
  green    : '#26e07f',
  red      : '#ff3b3b',
  border   : '#ffffff',
  greenDone: '#29cc4d',
  grey     : '#888888',
};
const CardHeight = vs(90);

interface QuestCardProps {
  item: QuestData; // Use the imported type
  goalTitle: string | null; // Add prop for the goal's title
  onComplete?: (id: string) => void;
  onSkip?: (id: string) => void;
  onIncrement?: (id: string) => void;
  onDecrement?: (id: string) => void;
  onSetCount?: (id: string, count: number) => void;
  onUndoStatus?: (id: string) => void;
}

export default function QuestCard({
  item,
  goalTitle, // Destructure the new prop
  onComplete,
  onSkip,
  onIncrement,
  onDecrement,
  onSetCount,
  onUndoStatus
}: QuestCardProps) {
  const Icon = ICONS[item.icon] || Barbell;
  const count = item.progress.current;

  const handleIncrement = () => onIncrement?.(item.id);
  const handleDecrement = () => onDecrement?.(item.id);
  const handleComplete = () => onComplete?.(item.id);
  const handleSkip = () => onSkip?.(item.id);
  const handleSetCount = (text: string) => {
    const newCount = Number(text.replace(/[^0-9]/g, ''));
    if (!isNaN(newCount)) {
       const clampedCount = Math.max(0, Math.min(item.progress.total, newCount));
       onSetCount?.(item.id, clampedCount);
    }
  };
  const handleUndo = () => onUndoStatus?.(item.id);

  const RightPanel = () => (
    <View style={styles.sideWrap}>
      <Pressable style={styles.iconBtn} onPress={handleIncrement}>
        <Plus size={s(14)} color={COLOR.green} weight="bold" />
      </Pressable>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={String(count)}
        onChangeText={handleSetCount}
        selectTextOnFocus={true}
      />
      <Pressable style={[styles.iconBtn, { marginTop: vs(6) }]} onPress={handleDecrement}>
        <Minus size={s(14)} color={COLOR.red} weight="bold" />
      </Pressable>
    </View>
  );

  const LeftPanel = () => (
    <View style={styles.sideWrap}>
      <Pressable style={styles.iconBtn} onPress={handleComplete}>
        <Check size={s(14)} color={COLOR.green} weight="bold" />
      </Pressable>
      <Pressable style={[styles.iconBtn, { marginTop: vs(8) }]} onPress={handleSkip}>
        <X size={s(14)} color={COLOR.red} weight="bold" />
      </Pressable>
    </View>
  );

  const isCompleted = item.status === 'completed';
  const isSkipped = item.status === 'skipped';
  const isInactive = isCompleted || isSkipped;

  const cardStyle = [
    styles.card,
    isCompleted && { borderColor: COLOR.greenDone },
    isSkipped && { borderColor: COLOR.red },
  ];

  const statusIcon = isCompleted 
      ? <CheckSquare size={s(20)} color={COLOR.greenDone} weight="fill" style={styles.statusIcon}/> 
      : isSkipped 
      ? <XSquare size={s(20)} color={COLOR.red} weight="fill" style={styles.statusIcon}/> 
      : null;

  return (
    <Swipeable
      renderRightActions={isInactive ? undefined : RightPanel}
      renderLeftActions={isInactive ? undefined : LeftPanel}
      enabled={!isInactive}
      overshootFriction={8}
    >
      <View style={cardStyle}>
        <View style={styles.row}>
          <Icon size={s(16)} color={COLOR.white} />
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        </View>

        {/* Display goalTitle if available */}
        {goalTitle && (
          <Text style={styles.parent}>{`Goal: ${goalTitle}`}</Text>
        )}

        <View style={styles.rowEnd}>
          {isInactive && (
            <Pressable onPress={handleUndo} style={styles.undoButtonContainer}>
              <ArrowULeftUp size={s(16)} color={COLOR.white} />
              <Text style={styles.undoText}>[undo]</Text>
            </Pressable>
          )}
          {statusIcon ? (
            statusIcon
          ) : (
            <Text style={styles.progress}>
              [{count}/{item.progress.total}]
            </Text>
          )}
        </View>
      </View>
    </Swipeable>
  );
}

/* ——— styles ——— */
const baseFont = { fontFamily: 'PressStart2P' };

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderColor: COLOR.border,
    padding          : s(10),
    backgroundColor  : COLOR.bg,
    width: '100%',
    marginTop        : vs(12),
    minHeight        : vs(65),
    justifyContent   : 'space-between',
    height           : CardHeight,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowEnd: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },

  title : { ...baseFont, color: COLOR.white, fontSize: s(11), marginLeft: s(6), flexShrink: 1 },
  parent: { ...baseFont, color: COLOR.green, fontSize: s(8), marginLeft: s(22), marginTop: vs(2) },
  progress: { ...baseFont, color: COLOR.white, fontSize: s(10) },

  sideWrap: {
    width          : s(58),
    height      : CardHeight,
    marginTop      : vs(12),
    justifyContent : 'center',
    alignItems     : 'center',
  },
  iconBtn: {
    width: s(26),
    height: vs(25),
    borderWidth: 2,
    borderColor: COLOR.border,
    justifyContent:'center',
    alignItems:'center',
  },
  input: {
    ...baseFont,
    color: COLOR.white,
    fontSize: s(10),
    marginTop: vs(6),
    marginBottom: vs(6),
    width: s(32),
    height: vs(20),
    textAlign: 'center',
    borderWidth: 2,
    borderColor: COLOR.border,
    padding: 0,
  },
  statusIcon: {
    marginLeft: s(5),
  },
  undoButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: s(4),
    marginRight: s(8),
  },
  undoText: {
    ...baseFont,
    color: COLOR.grey,
    fontSize: s(10),
    marginLeft: s(4),
  },
}); 