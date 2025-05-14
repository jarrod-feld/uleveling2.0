import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, ImageBackground, StyleSheet, Pressable, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, Layout, FadeOut } from 'react-native-reanimated';
import { CaretDown, CaretUp } from 'phosphor-react-native';
import DailyHeader from '@/components/dashboard/DailyHeader';
import { verticalScale as vs, scale as s } from '@/constants/scaling';
import QuestList from '@/components/dashboard/QuestList';
import QuestCard from '@/components/dashboard/QuestCard';
import { useQuestGoals } from '@/contexts/QuestGoalContext';
import { useAuth } from '@/contexts/UserContext';
import { router} from 'expo-router';
import CacheService from '@/services/CacheService';

const FONT = { fontFamily: 'PressStart2P' };

export default function Dashboard(){
  const { user, isLoading: isAuthLoading } = useAuth();
  
  const {
    quests = [],
    completeQuest,
    skipQuest,
    incrementQuestProgress,
    decrementQuestProgress,
    setQuestProgress,
    undoQuestStatus,
    refreshQuestGoalData,
    isQuestLoading,
  } = useQuestGoals();

  const [showCompleted, setShowCompleted] = useState(false);
  const [showSkipped, setShowSkipped] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activeQuests = useMemo(() => quests.filter(q => q.status === 'active'), [quests]);
  const completedQuests = useMemo(() => quests.filter(q => q.status === 'completed'), [quests]);
  const skippedQuests = useMemo(() => quests.filter(q => q.status === 'skipped'), [quests]);

  const completedCount = completedQuests.length;
  const skippedCount = skippedQuests.length;

  useEffect(() => {
    if (!isAuthLoading && !user) {
      console.log("[Dashboard] User not authenticated. Clearing warning cache and redirecting to onboarding...");
      CacheService.remove('warningDismissedDate')
        .then(() => console.log("[Dashboard] Warning cache cleared."))
        .catch(err => console.error("[Dashboard] Failed to clear warning cache:", err));
      
      router.replace("/index" as any);
    }
  }, [user, isAuthLoading, router]);

  const toggleCompleted = () => {
    setShowCompleted(prev => !prev);
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
    completeQuest(id);
  }, [completeQuest]);

  const handleSkipQuest = useCallback((id: string) => {
    skipQuest(id);
  }, [skipQuest]);

  const onRefresh = useCallback(async () => {
    console.log("[Dashboard] Pull-to-refresh triggered.");
    setIsRefreshing(true);
    try {
      await refreshQuestGoalData();
    } catch (error) {
      console.error("[Dashboard] Error during context refresh:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshQuestGoalData]);

  if (isAuthLoading || (!user && !isAuthLoading)) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#00ffff" />
      </View>
    );
  }

  if (isQuestLoading) {
    return (
      <View style={[styles.container, styles.centered]}> 
        <DailyHeader/> 
        <ActivityIndicator size="large" color="#ffffff" style={{ marginTop: vs(50) }}/>
        <Text style={styles.loadingText}>Loading Quests...</Text>
      </View>
    );
  }

  return(
    <ImageBackground source={require('@/assets/images/dashboard-bg.png')} style={styles.background}>
      <DailyHeader/>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer} 
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#ffffff"
          />
        }
      >
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#001a22',
    flex: 1,
    width: '100%',
    height: '100%',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: vs(50),
  },
  loadingText: {
    marginTop: vs(15),
    color: '#ffffff',
    fontSize: s(14),
    ...FONT,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContentContainer: {
     paddingBottom: vs(20),
  },
  questWrapper: {
    paddingHorizontal: s(20),
    width: "100%",
    alignSelf: 'center',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(15),
    marginTop: vs(10),
    marginHorizontal: s(20),
    borderTopWidth: 1, 
    borderTopColor: '#00ffff20',
  },
  dropdownText: {
    ...FONT,
    color: '#00ffff',
    fontSize: s(12),
    marginRight: s(8),
  }
}); 