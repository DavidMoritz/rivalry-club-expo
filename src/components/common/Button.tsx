import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { styles } from '../../utils/styles';

type ButtonProps = {
  disabled?: boolean;
  leftContent?: React.ReactNode;
  onPress: () => void;
  rightContent?: React.ReactNode;
  style?: ViewStyle;
  text: string;
  textStyle?: ViewStyle;
};

export function Button({
  disabled = false,
  leftContent,
  onPress,
  rightContent,
  style,
  text,
  textStyle
}: ButtonProps) {
  return (
    <TouchableOpacity
      style={[
        buttonStyles.button,
        disabled && buttonStyles.disabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {leftContent && leftContent}
      <Text
        style={[
          styles.text,
          buttonStyles.text,
          textStyle
        ]}
      >
        {text}
      </Text>
      {rightContent && rightContent}
    </TouchableOpacity>
  );
}

const buttonStyles = StyleSheet.create({
  button: {
    alignSelf: 'center',
    marginVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6b21a8',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 25,
    height: 36,
    paddingHorizontal: 24,
    paddingVertical: 12
  },
  disabled: {
    opacity: 0.5
  },
  text: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
