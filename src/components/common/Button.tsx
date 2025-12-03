import { Text, TouchableOpacity } from 'react-native';
import { twMerge } from 'tailwind-merge';

type ButtonProps = {
  className?: string;
  leftContent?: React.ReactNode;
  onPress: () => void;
  rightContent?: React.ReactNode;
  text: string;
  textClassName?: string;
};

export function Button({
  className,
  leftContent,
  onPress,
  rightContent,
  text,
  textClassName,
}: ButtonProps) {
  return (
    <TouchableOpacity
      className={twMerge(
        'self-center my-2 text-center justify-center items-center bg-purple-900 border rounded-full border-slate-300 h-9',
        className,
      )}
      onPress={onPress}>
      {leftContent && leftContent}
      <Text className={twMerge('px-3 py-1 text-white', textClassName)}>
        {text}
      </Text>
      {rightContent && rightContent}
    </TouchableOpacity>
  );
}
