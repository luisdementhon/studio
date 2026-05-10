import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { Colors, BorderRadius, FontSizes, Spacing } from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function Input({ label, error, icon, style, secureTextEntry, ...props }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPassword = secureTextEntry !== undefined;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focused,
          error && styles.errorBorder,
        ]}
      >
        {icon && (
          <Ionicons name={icon} size={20} color={Colors.muted} style={styles.icon} />
        )}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.muted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !isPasswordVisible}
          autoCapitalize="none"
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.muted}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  label: {
    fontFamily: 'Bricolage-Bold',
    fontSize: FontSizes.sm,
    color: Colors.foreground,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg, // matching rounded-xl
    paddingHorizontal: Spacing.md,
    minHeight: 48, // matching h-12
    borderWidth: 1.5,
    borderColor: 'rgba(161, 161, 170, 0.3)', // subtle border instead of transparent
  },
  focused: {
    borderColor: Colors.foreground,
  },
  errorBorder: {
    borderColor: Colors.error,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: 'Bricolage',
    fontSize: FontSizes.md,
    color: Colors.foreground,
  },
  error: {
    fontSize: FontSizes.sm,
    color: Colors.error,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
});
