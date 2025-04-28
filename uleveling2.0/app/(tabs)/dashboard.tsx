import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, Pressable, Text, ScrollView } from 'react-native';
import Animated, { FadeIn, Layout, FadeOut } from 'react-native-reanimated';
import { CaretDown, CaretUp } from 'phosphor-react-native';
import DailyHeader from '@/components/dashboard/DailyHeader';
import { Quest } from '@/mock/dashboardData';
import { verticalScale as vs, scale as s } from '@/constants/scaling';
import QuestList from '@/components/dashboard/QuestList';
import QuestCard from '@/components/dashboard/QuestCard';
import { useAuth } from '@/contexts/UserContext';

const FONT = { fontFamily: 'PressStart2P' };

export default function Dashboard(){
  console.log('>>> Dashboard Component Mounted/Rendered <<<');

  const {
    quests,
    completeQuest: completeQuestContext,
    skipQuest: skipQuestContext,
    incrementQuestProgress,
    decrementQuestProgress,
    setQuestProgress,
    undoQuestStatus
  } = useAuth();

  const [showCompleted, setShowCompleted] = useState(false);
  const [showSkipped, setShowSkipped] = useState(false);
  const [isScrollDisabled, setIsScrollDisabled] = useState(false);

  const activeQuests = useMemo(() => quests.filter(q => q.status === 'active'), [quests]);
  const completedQuests = useMemo(() => quests.filter(q => q.status === 'completed'), [quests]);
  const skippedQuests = useMemo(() => quests.filter(q => q.status === 'skipped'), [quests]);

  const completedCount = completedQuests.length;
  const skippedCount = skippedQuests.length;

  const toggleCompleted = () => {
    setShowCompleted(prev => {
      const newState = !prev;
      return newState;
    });
  };

  const toggleSkipped = () => {
    setShowSkipped(prev => !prev);
  };

  const handleUndoWithAutoHide = useCallback((id: string) => {
    undoQuestStatus(id);
    if (completedQuests.find(q => q.id === id) && completedQuests.length === 1) {
        setShowCompleted(false);
    }
    if (skippedQuests.find(q => q.id === id) && skippedQuests.length === 1) {
        setShowSkipped(false);
    }
  }, [undoQuestStatus, completedQuests, skippedQuests]);

  const handleCompleteQuest = useCallback((id: string) => {
    setIsScrollDisabled(true);
    completeQuestContext(id);
    setTimeout(() => {
      setIsScrollDisabled(false);
    }, 500);
  }, [completeQuestContext]);

  const handleSkipQuest = useCallback((id: string) => {
    setIsScrollDisabled(true);
    skipQuestContext(id);
    setTimeout(() => {
      setIsScrollDisabled(false);
    }, 500);
  }, [skipQuestContext]);

  return(
    <View style={styles.container}>
      <DailyHeader/>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContentContainer} scrollEnabled={!isScrollDisabled}>
        <QuestList 
          data={activeQuests}
          onComplete={handleCompleteQuest}
          onSkip={handleSkipQuest}
          onIncrement={incrementQuestProgress}
          onDecrement={decrementQuestProgress}
          onSetCount={setQuestProgress}
          onUndoStatus={handleUndoWithAutoHide}
        />

        {completedCount > 0 && (
          <Pressable onPress={toggleCompleted} style={styles.dropdownButton}>
            <Text style={styles.dropdownText}>Completed Tasks ({completedCount})</Text>
            {showCompleted 
              ? <CaretUp size={s(16)} color="#fff" /> 
              : <CaretDown size={s(16)} color="#fff" />
            }
          </Pressable>
        )}
        {showCompleted && completedQuests.map(quest => {
          return (
            <Animated.View 
              key={quest.id} 
              style={styles.questWrapper} 
              entering={FadeIn.duration(300)} 
              exiting={FadeOut.duration(250)}
            >
              <QuestCard
                item={quest}
                goalTitle={quest.goalTitle}
                onUndoStatus={handleUndoWithAutoHide}
              />
            </Animated.View>
          );
        })}

        {skippedCount > 0 && (
          <Pressable onPress={toggleSkipped} style={styles.dropdownButton}>
            <Text style={styles.dropdownText}>Skipped Tasks ({skippedCount})</Text>
            {showSkipped 
              ? <CaretUp size={s(16)} color="#fff" /> 
              : <CaretDown size={s(16)} color="#fff" />
            }
          </Pressable>
        )}
        {showSkipped && skippedQuests.map(quest => {
           return (
             <Animated.View 
               key={quest.id} 
               style={styles.questWrapper} 
               entering={FadeIn.duration(300)} 
               exiting={FadeOut.duration(250)}
             >
              <QuestCard
                item={quest}
                goalTitle={quest.goalTitle}
                onUndoStatus={handleUndoWithAutoHide}
              />
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#001a22',
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
     paddingBottom: vs(20),
  },
  questWrapper: {
    paddingHorizontal: s(20),
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(15),
    marginTop: vs(10),
    marginHorizontal: s(20),
    borderTopWidth: 1, 
    borderTopColor: '#ffffff20',
  },
  dropdownText: {
    ...FONT,
    color: '#fff',
    fontSize: s(12),
    marginRight: s(8),
  }
}); 