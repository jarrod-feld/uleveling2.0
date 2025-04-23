import React, { useRef, useEffect, useState } from 'react';
import { View, ImageBackground, StyleSheet, LayoutChangeEvent } from 'react-native';
import SoloPopup from './popup/SoloPopup';

interface Props {
  visible: boolean;
  currentStep: number;
  title?: React.ReactNode;
  children: React.ReactNode;
  onClose?: () => void;
}

export default function OnboardingPopup({
  visible, currentStep, title, children, onClose,
}: Props) {
  const modalRef = useRef<Modalize>(null);
  const [height, setHeight] = useState(0);

  /* open / close side-effect */
  useEffect(() => {
    if (visible) modalRef.current?.open();
    else         modalRef.current?.close();
  }, [visible]);

  /* measure step */
  const onLayout = (e: LayoutChangeEvent) => setHeight(e.nativeEvent.layout.height);

  return (
    <SoloPopup ref={modalRef} onClosed={onClose}>
      <ImageBackground
        source={require('@/assets/images/techno-background.gif')}
        style={styles.bg}
        imageStyle={{ resizeMode: 'cover' }}
      >
        <View key={`step-${currentStep}`} onLayout={onLayout}>
          {title}
          {children}
        </View>
      </ImageBackground>
    </SoloPopup>
  );
}

const styles = StyleSheet.create({ bg: { width: '100%', alignItems: 'center' } });
