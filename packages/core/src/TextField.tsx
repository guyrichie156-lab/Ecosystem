import React, { useState } from "react";
import { StyleSheet, TextInput, type TextInputProps } from "react-native";

// Without these Android paints the cursor, selection handles and underline in the
// AppCompat default accent, a teal the app doesn't use anywhere else.
const ACCENT = "#1f62b3";
const SELECTION = "rgba(31, 98, 179, 0.25)";

/** The app's text input: neutral border, accent border and cursor while focused. */
export function TextField({ style, onFocus, onBlur, ...props }: TextInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      placeholderTextColor="#6e6e73"
      cursorColor={ACCENT}
      selectionColor={SELECTION}
      selectionHandleColor={ACCENT}
      underlineColorAndroid="transparent"
      {...props}
      style={[styles.input, focused && styles.focused, style]}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
    />
  );
}

const styles = StyleSheet.create({
  // Border colours have at least 3:1 contrast with the white field (WCAG 1.4.11):
  // #8e8e93 is 3.26:1, the focused #1f62b3 is 6.08:1. Placeholder #6e6e73 is 5.07:1, enough for text.
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#8e8e93",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1c1c1e",
  },
  // The thicker border eats into the padding so the text doesn't jump on focus.
  focused: {
    borderWidth: 2,
    borderColor: ACCENT,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
});
