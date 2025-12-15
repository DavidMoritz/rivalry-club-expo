import { useRouter } from 'expo-router';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../utils/colors';

interface OfflineModalProps {
  visible: boolean;
  onClose: () => void;
}

export function OfflineModal({ visible, onClose }: OfflineModalProps) {
  const router = useRouter();

  const handleGoOffline = () => {
    onClose();
    router.push('/offline');
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent={true}
      visible={visible}
    >
      <View style={modalOverlayStyle}>
        <View style={modalContentStyle}>
          <Text style={titleStyle}>⚠️ Connection Lost</Text>
          <Text style={messageStyle}>
            Unable to access remote database. Would you like to play offline?
          </Text>

          <View style={buttonContainerStyle}>
            <TouchableOpacity
              onPress={handleGoOffline}
              style={[buttonStyle, primaryButtonStyle]}
            >
              <Text style={primaryButtonTextStyle}>Play Offline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={[buttonStyle, secondaryButtonStyle]}
            >
              <Text style={secondaryButtonTextStyle}>Stay Here</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalOverlayStyle = {
  flex: 1,
  backgroundColor: colors.overlayDark,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  padding: 20,
};

const modalContentStyle = {
  backgroundColor: colors.slate800,
  borderRadius: 16,
  padding: 24,
  width: '90%' as const,
  maxWidth: 400,
  borderWidth: 2,
  borderColor: colors.orange500,
};

const titleStyle = {
  fontSize: 24,
  fontWeight: 'bold' as const,
  color: colors.white,
  marginBottom: 16,
  textAlign: 'center' as const,
};

const messageStyle = {
  fontSize: 16,
  color: colors.slate300,
  marginBottom: 24,
  textAlign: 'center' as const,
  lineHeight: 24,
};

const buttonContainerStyle = {
  gap: 12,
};

const buttonStyle = {
  paddingVertical: 14,
  paddingHorizontal: 24,
  borderRadius: 8,
  alignItems: 'center' as const,
};

const primaryButtonStyle = {
  backgroundColor: colors.orange500,
};

const primaryButtonTextStyle = {
  color: colors.white,
  fontSize: 16,
  fontWeight: 'bold' as const,
};

const secondaryButtonStyle = {
  backgroundColor: colors.slate700,
  borderWidth: 1,
  borderColor: colors.slate600,
};

const secondaryButtonTextStyle = {
  color: colors.white,
  fontSize: 16,
};
