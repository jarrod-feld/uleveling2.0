import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { scale as s } from '@/constants/scaling'; // <-- Alias path

// Define Achievement type if not imported
interface Achievement {
  id: string;
  title: string;
}

export default function AchievementCard({ data }: { data: Achievement }) { // Typed data prop
  return (
    <View style={styles.box}>
      <Text style={styles.txt}>{data.title}</Text>
    </View>
  );
}
const styles=StyleSheet.create({
  box:{borderWidth:2,borderColor:'#fff',padding:s(10),marginHorizontal:s(20),marginTop:s(12)},
  txt:{fontFamily:'PressStart2P',color:'#fff',fontSize:s(10)}
}); 