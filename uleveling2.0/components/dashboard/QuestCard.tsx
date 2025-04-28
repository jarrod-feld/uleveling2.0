import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import {
  Barbell, Brain, Heart, Plus, Minus, Check, X, CheckSquare, XSquare, ArrowULeftUp, 
  Star, Lock, Briefcase, PaintBrush
} from 'phosphor-react-native';
import { scale as s, verticalScale as vs, scale as ms } from '@/constants/scaling';
import { Quest as QuestData } from '@/mock/dashboardData'; // Rename import to avoid conflict
import { StatCategory } from '@/types/quest'; // Import StatCategory
import QuestDetailPopup from './QuestDetailPopup'; // Import the popup component

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

// Copy iconGlowStyle from StatGrid (adjust scale factor if needed, using 1 here for QuestCard)
const iconGlowStyle = {
  shadowColor: "#fff",
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.8,
  shadowRadius: 4, // Base radius, adjust if desired for quest card
};

// Map StatCategory to Icon Component - Align with StatGrid
const STAT_CATEGORY_ICONS: Record<StatCategory, React.ElementType> = {
  STR: Barbell,
  INT: Brain,
  VIT: Heart,
  CHA: Star,       // Changed from User
  DIS: Lock,       // Changed from BookOpen
  CAR: Briefcase,  // Changed from ChartLine
  CRE: PaintBrush, // Changed from Lightbulb
};

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
  goalTitle,
  onComplete,
  onSkip,
  onIncrement,
  onDecrement,
  onSetCount,
  onUndoStatus
}: QuestCardProps) {
  // Get Icon components based on item.stats array (renamed from icons)
  const Icon1 = STAT_CATEGORY_ICONS[item.stats[0]] || Barbell; // Default to Barbell if somehow missing
  const Icon2 = item.stats[1] ? STAT_CATEGORY_ICONS[item.stats[1]] : null;
  
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

  // State for popup visibility and selected quest
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  const openPopup = () => {
    console.log("Single tap detected, opening popup for:", item.id);
    setIsPopupVisible(true);
  };

  const closePopup = () => {
    setIsPopupVisible(false);
  };

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
    <>
      <Swipeable
        renderRightActions={!isInactive ? RightPanel : undefined}
        renderLeftActions={!isInactive ? LeftPanel : undefined}
        enabled={!isInactive}
        overshootFriction={4}
        friction={2}
        activeOffsetX={[-15, 15]}
      >
        <Pressable onPress={openPopup}>
          <View style={cardStyle}>
            <View style={styles.topContent}>
              <View style={styles.row}>
                <View style={styles.iconColumn}>
                  <View style={styles.firstIconWrapper}>
                    <Icon1 size={ms(20)} color={COLOR.white} weight="fill" />
                  </View>
                  {Icon2 && (
                    <View style={styles.secondIconWrapper}>
                      <Icon2 size={ms(16)} color={COLOR.white} weight="fill" />
                    </View>
                  )}
                </View>
                <View style={styles.textColumn}>
                  <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                  {goalTitle && (
                    <Text style={styles.parent}>{`Goal: ${goalTitle}`}</Text>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.rowEnd}>
              {isInactive && (
                <Pressable onPress={handleUndo} style={styles.undoButtonContainer}>
                  <Text style={styles.undoText}>[undo]</Text>
                </Pressable>
              )}
              <View style={{ flex: 1 }} />
              {statusIcon ? (
                statusIcon
              ) : (
                <Text style={styles.progress}>
                  [{count}/{item.progress.total}]
                </Text>
              )}
            </View>
          </View>
        </Pressable>
      </Swipeable>

      {/* Always render the popup, let its 'isVisible' prop handle animation */}
      <QuestDetailPopup 
        quest={item} 
        goalTitle={goalTitle} 
        isVisible={isPopupVisible} // Pass visibility down
        onClose={closePopup}
      />
    </>
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
    justifyContent   : 'space-between',
    height           : CardHeight,
    paddingLeft: s(6),
  },
  topContent: {
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'flex-start'
  },
  rowEnd: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: vs(5),
  },
  iconColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(7),
    minWidth: ms(20),
  },
  textColumn: {
    flex: 1,
    flexDirection: 'column',
    marginLeft: s(2),
  },
  firstIconWrapper: {
    ...iconGlowStyle,
  },
  secondIconWrapper: {
    ...iconGlowStyle,
    opacity: 0.7,
    marginTop: vs(3),
  },
  title : { ...baseFont, color: COLOR.white, fontSize: s(11), flexShrink: 1, marginTop: vs(2) },
  parent: { 
    ...baseFont, 
    color: COLOR.green, 
    fontSize: s(8), 
    marginTop: vs(4),
  },
  progress: { 
    ...baseFont, 
    color: COLOR.white, 
    fontSize: s(10), 
  },
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
  },
  undoButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: s(5),
    marginLeft: 0,
  },
  undoText: {
    ...baseFont,
    color: COLOR.grey,
    fontSize: s(10),
  },
}); 