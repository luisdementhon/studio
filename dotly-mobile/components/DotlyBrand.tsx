import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Theme';

type DotlyBrandProps = {
  size?: number;
  color?: string;
};

export function DotlyBrand({ size = 28, color = Colors.foreground }: DotlyBrandProps) {
  return (
    <Text style={[styles.brand, { fontSize: size, color }]}>
      dotly<Text style={{ color: Colors.coral }}>.</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  brand: {
    fontFamily: 'Bricolage-Bold',
    fontWeight: '700',
    letterSpacing: -1,
  },
});
