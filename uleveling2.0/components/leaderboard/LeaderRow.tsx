import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { scale as s } from '@/constants/scaling'; // <-- Alias path

// Define User type if not imported
interface User {
  id: string;
  name: string;
  score: number;
}

export default function LeaderRow({ user }: { user: User }) { // Typed user prop
  return (
    <View style={styles.row}>
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.score}>{user.score}</Text>
    </View>
  );
}
const styles=StyleSheet.create({
  row:{flexDirection:'row',justifyContent:'space-between',borderWidth:2,borderColor:'#fff',padding:s(8),marginHorizontal:s(20),marginTop:s(10)},
  name:{fontFamily:'PressStart2P',color:'#fff',fontSize:s(10)},
  score:{fontFamily:'PressStart2P',color:'#26e07f',fontSize:s(10)}
}); 