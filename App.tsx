import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import './global.css';

export default function App() {
  return (
    <View className="flex-1 bg-black items-center justify-center">
      <Text className="text-white text-2xl font-bold">Rivalry Club</Text>
      <Text className="text-gray-400 mt-4">Built with Expo + NativeWind</Text>
      <StatusBar style="light" />
    </View>
  );
}
