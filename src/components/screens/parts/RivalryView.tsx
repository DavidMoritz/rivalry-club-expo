import { useRouter } from 'expo-router';
import React from 'react';

import { useHideRivalryMutation } from '../../../controllers/c-rivalry';
import { useAuthUser } from '../../../hooks/useAuthUser';
import { useRivalry } from '../../../providers/rivalry';
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
  const [isCurrentlyHidden, setIsCurrentlyHidden] = React.useState<boolean>(false);

  const hideRivalryMutation = useHideRivalryMutation({
    onSuccess: () => {
      // Only navigate back to /rivalries when hiding (not when unhiding)
      if (!isCurrentlyHidden) {
        router.push('/rivalries');
      } else {
        // If unhiding, just update the local state
        setIsCurrentlyHidden(false);
      }
    }
  });

  //add useEffect to update isCurrentlyHidden when rivalry changes
  React.useEffect(() => {
    if (!rivalry || !user?.id) return;

    const isUserA = rivalry?.userAId === user?.id;
    const updatedHiddenState = isUserA ? rivalry?.hiddenByA : rivalry?.hiddenByB;
    console.log('RivalryView - rivalry changed, updatedHiddenState:', updatedHiddenState);
    setIsCurrentlyHidden(updatedHiddenState ?? false);
  }, [rivalry, user?.id]);

  //add useEfffect to log isCurrentlyHidden when it changes
  React.useEffect(() => {
    console.log('RivalryView - isCurrentlyHidden changed:', isCurrentlyHidden);
  }, [isCurrentlyHidden]);

  const handleToggleHideRivalry = () => {
    if (!rivalry?.id || !user?.id) return;

    hideRivalryMutation.mutate({
      rivalryId: rivalry.id,
      userId: user.id,
      isUserA: rivalry.userAId === user.id,
      hidden: !isCurrentlyHidden
    });
  };

  return (
    <>
      <Button
        onPress={() => {
          navigation.navigate('RivalryTiersView');
        }}
        text="View Tier Lists"
        style={{ height: 48, paddingHorizontal: 48, width: 256 }}
      />
      <Button
        onPress={() => {
          navigation.navigate('ContestHistory');
        }}
        text={`View ${displayCount} ${displayContest}`}
        style={{ height: 48, paddingHorizontal: 48, width: 256 }}
      />
      <Button
        onPress={handleToggleHideRivalry}
        text={isCurrentlyHidden ? 'Unhide Rivalry' : 'Hide Rivalry'}
        style={{
          height: 48,
          paddingHorizontal: 48,
          width: 256,
          backgroundColor: '#dc2626'
        }}
      />
    </>
  );
}
