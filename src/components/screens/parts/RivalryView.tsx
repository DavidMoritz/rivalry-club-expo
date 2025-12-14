import { useRouter } from 'expo-router';
import React from 'react';

import { useHideRivalryMutation } from '../../../controllers/c-rivalry';
import { useAuthUser } from '../../../hooks/useAuthUser';
import { useRivalry } from '../../../providers/rivalry';
import { colors } from '../../../utils/colors';
import { Button } from '../../common/Button';

interface RivalryViewProps {
  navigation: {
    navigate: (screen: string) => void;
  };
}

export function RivalryView({ navigation }: RivalryViewProps) {
  const router = useRouter();
  const rivalry = useRivalry();
  const { user } = useAuthUser();
  const displayCount = Math.max((rivalry?.contestCount ?? 1) - 1, 0);
  const displayContest = displayCount === 1 ? 'Contest' : 'Contests';
  const [isCurrentlyHidden, setIsCurrentlyHidden] =
    React.useState<boolean>(false);

  const hideRivalryMutation = useHideRivalryMutation({
    onSuccess: () => {
      // Only navigate back to /rivalries when hiding (not when unhiding)
      if (isCurrentlyHidden) {
        // If unhiding, just update the local state
        setIsCurrentlyHidden(false);
      } else {
        router.push('/rivalries');
      }
    },
  });

  //add useEffect to update isCurrentlyHidden when rivalry changes
  React.useEffect(() => {
    if (!(rivalry && user?.id)) return;

    const isUserA = rivalry?.userAId === user?.id;
    const updatedHiddenState = isUserA
      ? rivalry?.hiddenByA
      : rivalry?.hiddenByB;

    setIsCurrentlyHidden(updatedHiddenState ?? false);
  }, [rivalry, user?.id]);

  const handleToggleHideRivalry = () => {
    if (!(rivalry?.id && user?.id)) return;

    hideRivalryMutation.mutate({
      rivalryId: rivalry.id,
      userId: user.id,
      isUserA: rivalry.userAId === user.id,
      hidden: !isCurrentlyHidden,
    });
  };

  return (
    <>
      <Button
        onPress={() => {
          navigation.navigate('RivalryTiersView');
        }}
        style={primaryButtonStyle}
        text="View Tier Lists"
      />
      <Button
        onPress={() => {
          navigation.navigate('ContestHistory');
        }}
        style={primaryButtonStyle}
        text={`View ${displayCount} ${displayContest}`}
      />
      <Button
        onPress={handleToggleHideRivalry}
        style={isCurrentlyHidden ? unhideButtonStyle : linkButtonStyle}
        text={isCurrentlyHidden ? 'Unhide Rivalry' : 'Hide Rivalry'}
        textStyle={isCurrentlyHidden ? {} : linkTextStyle}
      />
    </>
  );
}

const primaryButtonStyle = {
  height: 48,
  paddingHorizontal: 0,
  paddingVertical: 0,
  width: 256,
};

const unhideButtonStyle = {
  ...primaryButtonStyle,
  backgroundColor: colors.red500,
};

const linkButtonStyle = {
  backgroundColor: colors.none,
  borderWidth: 0,
  height: 'auto' as const,
  width: 'auto' as const,
  paddingHorizontal: 4,
  paddingVertical: 4,
};

const linkTextStyle = {
  color: colors.slate400,
  fontSize: 14,
  fontWeight: 'normal' as const,
  textDecorationLine: 'underline' as const,
};
