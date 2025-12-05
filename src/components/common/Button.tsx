import { Text, TouchableOpacity, ViewStyle } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { styles } from '../../utils/styles';

type ButtonProps = {
  className?: string;
  disabled?: boolean;
  leftContent?: React.ReactNode;
  onPress: () => void;
  rightContent?: React.ReactNode;
  style?: ViewStyle;
  text: string;
  textClassName?: string;
};

export function Button({
  className,
  disabled = false,
  leftContent,
  onPress,
  rightContent,
  style,
  text,
  textClassName
}: ButtonProps) {
  return (
    <TouchableOpacity
      className={twMerge(
        'self-center my-2 text-center justify-center items-center bg-purple-900 border rounded-full border-slate-300 h-9',
        disabled && 'opacity-50',
        className
      )}
      style={[
        {
          backgroundColor: '#6b21a8',
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 8,
          marginTop: 16,
          alignItems: 'center'
        },
        style
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {leftContent && leftContent}
      <Text
        style={[styles.text, { fontSize: 16, fontWeight: 'bold' }]}
        className={twMerge('px-3 py-1 text-white', textClassName)}
      >
        {text}
      </Text>
      {rightContent && rightContent}
    </TouchableOpacity>
  );
}
