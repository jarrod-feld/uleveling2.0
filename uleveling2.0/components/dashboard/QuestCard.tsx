import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import {
  Barbell, Brain, Heart, Check, X, CheckSquare, XSquare, Info,
  Star, Lock, Briefcase, PaintBrush
} from 'phosphor-react-native';
import { scale as s, verticalScale as vs, scale as ms } from '@/constants/scaling';
import { Quest as QuestData } from '@/mock/dashboardData';
import { StatCategory } from '@/types/quest';
import QuestDetailPopup from './QuestDetailPopup';

const COLOR = {
  bg       : '#002A35',
  white    : '#ffffff',
  green    : '#26e07f',
  red      : '#ff3b3b',
  border   : '#ffffff',
  greenDone: '#29cc4d',
  grey     : '#888888',
  progressButtonBg: '#004052',
};
const CardHeight = vs(130);
const CardMarginTop = vs(12);

const iconGlowStyle = {
  shadowColor: "#fff",
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.8,
  shadowRadius: 4,
};

const STAT_CATEGORY_ICONS: Record<StatCategory, React.ElementType> = {
  STR: Barbell,
  INT: Brain,
  VIT: Heart,
  CHA: Star,       
  DIS: Lock,       
  CAR: Briefcase,  
  CRE: PaintBrush, 
};

interface QuestCardProps {
  item: QuestData;
  goalTitle: string | null;
  onComplete?: (id: string) => void;
  onSkip?: (id: string) => void;
  onUndoStatus?: (id: string) => void;
  onIncrement?: (id: string) => void; 
  onDecrement?: (id: string) => void;
  onSetCount?: (id: string, count: number) => void;
}

export default function QuestCard({
  item,
  goalTitle,
  onComplete,
  onSkip,
  onUndoStatus,
  onIncrement,
  onDecrement,
  onSetCount
}: QuestCardProps) {

  // --- Debugging Logs --- 
  // console.log('---------------------------');
  // console.log(`[QuestCard] Rendering Card for ID: ${item?.id}, Title: ${item?.title}`);
  // console.log('[QuestCard] Full item prop:', JSON.stringify(item, null, 2));
  // console.log('[QuestCard] item.stats:', JSON.stringify(item?.stats, null, 2));
  // console.log('[QuestCard] item.statIncrements:', JSON.stringify(item?.statIncrements, null, 2));
  // console.log('[QuestCard] item.progress:', JSON.stringify(item?.progress, null, 2));
  // console.log('---------------------------');
  // ----------------------

  // --- Add safe defaults right before use, if logs show issues ---
  // Example (uncomment and adapt based on logs):
  // const safeStats = Array.isArray(item.stats) ? item.stats : [];
  // const safeProgress = typeof item.progress === 'object' && item.progress !== null 
  //                      ? item.progress 
  //                      : { current: 0, total: 1 }; 
  // ------------------------------------------------------------

  const Icon1 = STAT_CATEGORY_ICONS[item.stats[0]] || Barbell;
  const Icon2 = item.stats[1] ? STAT_CATEGORY_ICONS[item.stats[1]] : null;
  
  const count = item.progress.current;
  const total = item.progress.total;
  const swipeableRef = useRef<Swipeable>(null);

  const handleComplete = () => {
    if (onComplete) {
      onComplete(item.id);
    }
  };
  const handleSkip = () => {
    if (onSkip) {
      onSkip(item.id);
    }
  };
  const handleUndo = () => {
    // console.log(`[QuestCard] handleUndo called for item ID: ${item.id}`); // Removed
    onUndoStatus?.(item.id);
  };

  const [isPopupVisible, setIsPopupVisible] = useState(false);

  const openPopup = () => {
    if (!isInactive) {
       // console.log(`[QuestCard] openPopup called for item ID: ${item.id}`); // Removed
       setIsPopupVisible(true);
    }
  };

  const closePopup = () => {
    setIsPopupVisible(false);
  };

  const handleSwipeOpen = (direction: 'left' | 'right') => {
    swipeableRef.current?.close(); 
    if (direction === 'left' && !isInactive) {
      handleComplete();
    } else if (direction === 'right' && !isInactive) {
      handleSkip();
    }
  };
  
  const renderLeftActions = () => (
     <View style={[styles.swipeActionBackground, { backgroundColor: COLOR.green, alignItems: 'flex-start' }]}>
        <Check size={s(20)} color={COLOR.white} weight="bold" style={styles.swipeActionIcon} />
     </View>
  );
  const renderRightActions = () => (
     <View style={[styles.swipeActionBackground, { backgroundColor: COLOR.red, alignItems: 'flex-end' }]}>
         <X size={s(20)} color={COLOR.white} weight="bold" style={styles.swipeActionIcon} />
     </View>
  );

  const isCompleted = item.status === 'completed';
  const isSkipped = item.status === 'skipped';
  const isInactive = isCompleted || isSkipped;

  const statusIcon = isCompleted 
      ? <CheckSquare size={s(20)} color={COLOR.greenDone} weight="fill" style={styles.statusIcon}/> 
      : isSkipped 
      ? <XSquare size={s(20)} color={COLOR.red} weight="fill" style={styles.statusIcon}/> 
      : null;

  return (
    <>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={!isInactive ? renderRightActions : undefined}
        renderLeftActions={!isInactive ? renderLeftActions : undefined}
        onSwipeableOpen={handleSwipeOpen}
        enabled={!isInactive}
        friction={0.8}
        overshootFriction={3}
        activeOffsetX={[-10, 10]}
        rightThreshold={60}
        leftThreshold={60}
      >
        <Pressable disabled={isInactive}>
          <View style={styles.cardFrameContainer}>
            <View style={styles.cardContent}>
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
                    <Text style={[styles.title, { fontWeight: '600' }]} numberOfLines={1}>{item.title}</Text>
                    {goalTitle && (
                      <Text style={[styles.parent, { fontWeight: '600' }]}>{`Goal: ${goalTitle}`}</Text>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.rowEnd}>
                {isInactive ? (
                  <Pressable onPress={handleUndo} style={styles.actionButtonContainer}>
                    <Text style={styles.undoText}>[undo]</Text>
                  </Pressable>
                ) : (
                  <View style={styles.actionButtonContainer} />
                )}
                <View style={{ flex: 1 }} />
                {statusIcon ? (
                  statusIcon
                ) : (
                  <Pressable onPress={openPopup} style={styles.progressButton}>
                    <Text style={[styles.progressButtonText, { fontWeight: '600' }] }>
                      [{count}/{total}]
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
            <Image
              source={require('@/assets/images/questcardframe.png')}
              style={styles.cardFrameOverlay}
              resizeMode='stretch'
            />
          </View>
        </Pressable>
      </Swipeable>

      <QuestDetailPopup 
        quest={item} 
        goalTitle={goalTitle} 
        isVisible={isPopupVisible} 
        onClose={closePopup}
        onSetCount={onSetCount}
        isQuestInactive={isInactive}
      />
    </>
  );
}

/* ——— styles ——— */
const baseFont = { fontFamily: 'EuroStyle' };

const styles = StyleSheet.create({
  cardFrameContainer: {
    width: '100%',
    height: CardHeight + CardMarginTop,
    marginTop: CardMarginTop,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    position: 'absolute',
    top: CardMarginTop * 0.1,
    left: 0,
    right: 0,
    bottom: 0,
    margin: s(5), // inset to avoid overlaying frame edges
    backgroundColor: COLOR.bg,
    padding: s(10),
    paddingLeft: s(6),
    justifyContent: 'space-between',
  },
  cardFrameOverlay: {
    width: '100%',
    height: CardHeight,
    position: 'absolute',
    top: 0,
    left: 0,
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
    justifyContent: 'flex-start',
    marginRight: s(7),
    marginTop: vs(2),
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
  title : { ...baseFont, color: '#00ffff', fontSize: s(12), flexShrink: 1, marginTop: vs(2) },
  parent: { 
    ...baseFont,
    color: '#00ffff',
    fontSize: s(10),
    marginTop: vs(4),
  },
  progress: { 
    ...baseFont, 
    color: COLOR.white, 
    fontSize: s(10), 
    marginRight: s(4),
  },
  statusIcon: {
     marginRight: s(4),
  },
  actionButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
   
    
    marginLeft: 0,
  },
  undoText: {
    ...baseFont,
    color: '#00ffff',
    fontSize: s(10),
  },
  swipeActionBackground: {
    flex: 1,
    justifyContent: 'center',
    height: CardHeight,
    marginTop: CardMarginTop,
    paddingHorizontal: s(20),
  },
  swipeActionIcon: {
  },
  progressButton: {
     backgroundColor: COLOR.progressButtonBg,
     paddingVertical: vs(4),
     paddingHorizontal: s(8),
     borderRadius: s(4),
     borderWidth: 1,
     borderColor: COLOR.border,
     marginRight: s(4),
  },
  progressButtonText: {
     ...baseFont,
     color: '#00ffff',
     fontSize: s(12),
  },
}); 