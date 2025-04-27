import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Target, Crown, CaretDoubleDown, UsersThree, GridFour } from 'phosphor-react-native';
import { moderateScale as ms } from '@/constants/scaling';
import { TabKey } from '@/app/(tabs)/_layout';

// Define the visual order of icons (UPDATED ORDER)
const ICONS_ORDER: TabKey[] = [
  'stats',         // Far left
  'roadmap',       // Second left
  'dashboard',     // Middle icon
  'leaderboard',   // Fourth position
  'achievements',  // Far right
];

// Map keys to their respective icons
const ICONS_MAP: Record<TabKey, any> = {
  roadmap     : Target,
  achievements: Crown,
  dashboard   : GridFour,
  leaderboard : UsersThree,
  stats       : CaretDoubleDown,
};

interface Props { 
  active: TabKey; 
  onChange:(k:TabKey)=>void; 
  disabled?: boolean;
}

export default function TabBar({ active, onChange, disabled }:Props){
  return(
    <View style={styles.bar}>
      {ICONS_ORDER.map(k => { // Iterate based on the defined order
        const Icon = ICONS_MAP[k]; // Get the icon component from the map
        return (
          <TouchableOpacity
            key={k}
            style={styles.btn}
            onPress={() => {
              console.log(`TabBar: onPress called with key: ${k}`);
              onChange(k);
            }}
            disabled={disabled}
          >
            <Icon size={ms(22)} color={active === k ? '#26a8ff' : '#fff'} weight={active === k ? 'fill' : 'regular'} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const styles=StyleSheet.create({
  bar:{ flexDirection:'row', borderWidth:ms(3), borderColor:'#fff', margin:ms(20), backgroundColor:'#000' },
  btn:{ flex:1, alignItems:'center', paddingVertical:ms(10) },
}); 