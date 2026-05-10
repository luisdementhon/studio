import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import RNSlider from '@react-native-community/slider';
import { Colors, FontSizes, Spacing } from '@/constants/Theme';

interface SliderProps {
  minimumValue: number;
  maximumValue: number;
  step?: number;
  value: number;
  onValueChange: (value: number) => void;
  label?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  bottomText?: string;
}

export function Slider({
  minimumValue,
  maximumValue,
  step = 1,
  value,
  onValueChange,
  label,
  leftAddon,
  rightAddon,
  bottomText,
}: SliderProps) {
  return (
    <View style={styles.container}>
      {(label || leftAddon || rightAddon) && (
        <View style={styles.header}>
          {leftAddon}
          {label && <Text style={styles.label}>{label}</Text>}
          {rightAddon}
        </View>
      )}
      
      <RNSlider
        style={styles.slider}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor={Colors.coral}
        maximumTrackTintColor="#E5E5E5"
        thumbTintColor={Colors.coral}
      />
      
      {bottomText && <Text style={styles.bottomText}>{bottomText}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.foreground,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  bottomText: {
    fontSize: 10,
    color: Colors.muted,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: Spacing.xs,
  },
});
