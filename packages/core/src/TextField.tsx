import React, { useState } from "react";
import { StyleSheet, TextInput, type TextInputProps } from "react-native";
import { useTheme, useThemedStyles, type Theme } from "./theme";

/**
 * The app's text input: neutral border, link-coloured border and cursor while focused.
 * Without explicit colours Android paints the cursor, selection handles and underline in the
 * AppCompat default accent, a teal the app doesn't use anywhere else.
 */
export function TextField({ style, onFocus, onBlur, ...props }: TextInputProps) {
  const [focused, setFocused] = useState(false);
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <TextInput
      placeholderTextColor={theme.textMuted}
      cursorColor={theme.link}
      selectionColor={theme.dark ? "rgba(110, 168, 240, 0.35)" : "rgba(31, 98, 179, 0.25)"}
      selectionHandleColor={theme.link}
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

// The border has at least 3:1 contrast with the field, the focused link colour more than 6:1,
// and the placeholder (textMuted) at least 4.5:1 — see theme.ts.
const makeStyles = (t: Theme) =>
  StyleSheet.create({
    input: {
      backgroundColor: t.background,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: t.text,
      // Browsers draw their own dark focus ring over the border; the coloured border already marks focus.
      outlineStyle: "solid",
      outlineWidth: 0,
    },
    // The thicker border eats into the padding so the text doesn't jump on focus.
    focused: {
      borderWidth: 2,
      borderColor: t.link,
      paddingHorizontal: 13,
      paddingVertical: 11,
    },
  });
