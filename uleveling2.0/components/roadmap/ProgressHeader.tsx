import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { scale as s } from '@/constants/scaling';

export default function ProgressHeader() {
  return (
    <View style={styles.box}>
      <Text style={styles.t}>My Progress</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#002A35',
    marginHorizontal: s(20),
    marginTop: s(20),
    padding: s(12)
  },
  t: {
    fontFamily: 'PressStart2P',
    fontSize: s(20),
    color: '#fff',
    textAlign: 'center'
  },
}); 