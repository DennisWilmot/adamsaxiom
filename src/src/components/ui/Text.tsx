// src/components/ui/Input.tsx
import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput as RNTextInput, TextInputProps as RNTextInputProps } from 'react-native';

interface InputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  containerStyle?: object;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focusedInput,
          error && styles.errorInput,
        ]}
      >
        <RNTextInput
          style={styles.input}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor="#a0a0a0"
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  input: {
    height: 48,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333333',
  },
  focusedInput: {
    borderColor: '#3498db',
  },
  errorInput: {
    borderColor: '#e74c3c',
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: '#e74c3c',
  },
});

export default Input;