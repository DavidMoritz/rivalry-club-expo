import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  Text,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';

import { logoImage } from '../../../assets/images/games/ssbu';
import { darkStyles, lightStyles, styles } from '../../utils/styles';
import { s3Favicons } from '../../utils';
import { Button } from '../common/Button';
import { GameWithCharactersDisplay } from './GameWithCharactersDisplay';
import { useAuthUser } from '../../hooks/useAuthUser';
import { useUpdateGame } from '../../providers/game';
import { getMGame } from '../../models/m-game';

// Lazy client initialization
let client: ReturnType<typeof generateClient<Schema>> | null = null;

function getClient() {
  if (!client) {
    client = generateClient<Schema>();
  }
  return client;
}

// Hardcoded game ID (since there's only one game in your DB)
const GAME_ID = '73ed69cf-2775-43d6-bece-aed10da3e25a';

interface Game {
  id: string;
  name: string;
}

interface HomeProps {
  onEnterClick: (game: Game) => void;
  onHowToPlayClick?: () => void;
}

export default function Home({ onEnterClick, onHowToPlayClick }: HomeProps) {
  // Initialize user immediately on home screen (creates anonymous user in background)
  const { user } = useAuthUser();
  const setGame = useUpdateGame();

  const isDarkMode = true;

  // Fetch game with fighters from DB immediately
  const { data: game, isLoading } = useQuery({
    queryKey: ['game-with-fighters', GAME_ID],
    queryFn: async () => {
      console.log('[Home] Fetching game with fighters from DB...');

      const { data: fighters, errors } = await getClient().models.Fighter.list({
        filter: {
          gameId: {
            eq: GAME_ID
          }
        },
        selectionSet: ['id', 'name', 'gamePosition', 'winCount', 'contestCount']
      });

      if (errors) {
        console.error('[Home] Error fetching fighters:', errors);
        throw new Error('Failed to fetch fighters');
      }

      console.log('[Home] Fetched', fighters.length, 'fighters with stats');

      // Calculate win percentages and rank fighters
      const fightersWithRanks = fighters.map((fighter) => {
        const winRate =
          fighter.contestCount &&
          fighter.contestCount > 0 &&
          fighter.winCount !== null &&
          fighter.winCount !== undefined
            ? (fighter.winCount / fighter.contestCount) * 100
            : 0;
        return { ...fighter, winRate };
      });

      // Sort by win rate (descending) and assign ranks
      fightersWithRanks.sort((a, b) => b.winRate - a.winRate);

      const rankedFighters = fightersWithRanks.map((fighter, index) => ({
        ...fighter,
        rank: index + 1
      }));

      console.log(
        '[Home] Top 3 fighters by rank:',
        rankedFighters
          .slice(0, 3)
          .map((f) => `${f.rank}. ${f.name} (${f.winRate.toFixed(1)}%)`)
          .join(', ')
      );

      return {
        id: GAME_ID,
        name: 'Super Smash Bros. Ultimate',
        fighters: { items: rankedFighters }
      };
    }
  });

  // Update GameProvider when game data is fetched
  useEffect(() => {
    if (game) {
      const mGame = getMGame(game as any);
      setGame(mGame);
      console.log('[Home] Updated GameProvider with game data');
    }
  }, [game, setGame]);

  return (
    <SafeAreaView
      style={[styles.container, isDarkMode ? darkStyles.container : lightStyles.container]}
    >
      <View style={styles.viewUpper}>
        <TouchableWithoutFeedback onPress={() => game && onEnterClick(game)}>
          <Image
            style={styles.siteLogoImage}
            source={{
              uri: `${s3Favicons}/swords-144.png`
            }}
          />
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={() => game && onEnterClick(game)}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Rivalry Club</Text>
          </View>
        </TouchableWithoutFeedback>
        <Button
          text="Enter"
          onPress={() => game && onEnterClick(game)}
          style={{ marginTop: 4, marginBottom: 8, width: '50%', paddingVertical: 0 }}
        />
      </View>
      {!game && <Image style={styles.gameLogoImage} source={logoImage} />}
      <View style={styles.viewLower}>
        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 }}>
            <ActivityIndicator size="large" color="#60a5fa" />
            <Text style={{ color: '#999', fontSize: 16, marginTop: 16 }}>Loading fighters...</Text>
          </View>
        ) : game ? (
          <GameWithCharactersDisplay game={game} onHowToPlayClick={onHowToPlayClick} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}
