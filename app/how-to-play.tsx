import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HamburgerMenu } from '../src/components/common/HamburgerMenu';
import { darkStyles, styles } from '../src/utils/styles';

export default function HowToPlay() {
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, darkStyles.container]} edges={['top', 'bottom']}>
      <HamburgerMenu />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
      >
        {/* Header */}
        <View
          style={{
            paddingVertical: 24,
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: '#333'
          }}
        >
          <Text style={[styles.text, { fontSize: 32, fontWeight: 'bold', marginBottom: 8 }]}>
            Rivalry Club
          </Text>
          <Text style={[styles.text, { fontSize: 16, color: '#6b21a8' }]}>How to Play</Text>
        </View>

        {/* Introduction */}
        <View style={{ marginTop: 24 }}>
          <Text style={[styles.text, { fontSize: 18, fontWeight: 'bold', marginBottom: 12 }]}>
            Welcome to Rivalry Club!
          </Text>
          <Text style={[styles.text, { fontSize: 16, lineHeight: 24, marginBottom: 16 }]}>
            Challenge your rival with customized, auto-balancing tier lists! Learn this exciting new
            way to play your favorite fighting game.
          </Text>
        </View>

        {/* Section 1: Create an Account */}
        <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: '#333', paddingTop: 20 }}>
          <Text
            style={[
              styles.text,
              { fontSize: 20, fontWeight: 'bold', color: '#6b21a8', marginBottom: 12 }
            ]}
          >
            1. Create an Account
          </Text>
          <Text style={[styles.text, { fontSize: 16, lineHeight: 24 }]}>
            First, you and your rival must create accounts. Tap "Sign Up" on the authentication
            screen to get started.
          </Text>
        </View>

        {/* Section 2: Start a Rivalry */}
        <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: '#333', paddingTop: 20 }}>
          <Text
            style={[
              styles.text,
              { fontSize: 20, fontWeight: 'bold', color: '#6b21a8', marginBottom: 12 }
            ]}
          >
            2. Start a Rivalry
          </Text>
          <Text style={[styles.text, { fontSize: 16, lineHeight: 24, marginBottom: 12 }]}>
            After creating your accounts:
          </Text>
          <Text style={[styles.text, { fontSize: 16, lineHeight: 24, marginLeft: 16 }]}>
            • Tap "Create New Rivalry"{'\n'}• Search for and select your opponent{'\n'}• Choose your
            game (currently Super Smash Ultimate){'\n'}• Your tier lists will be randomly generated
          </Text>
        </View>

        {/* Section 3: Edit Your Tier List */}
        <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: '#333', paddingTop: 20 }}>
          <Text
            style={[
              styles.text,
              { fontSize: 20, fontWeight: 'bold', color: '#6b21a8', marginBottom: 12 }
            ]}
          >
            3. Edit Your Tier List
          </Text>
          <Text style={[styles.text, { fontSize: 16, lineHeight: 24, marginBottom: 12 }]}>
            Most tiers (S, A, B, C, D, E) contain 12 characters, while F Tier contains 14 characters.
            Rank characters from your best in S Tier down to your worst in F Tier.
          </Text>
          <Text style={[styles.text, { fontSize: 16, lineHeight: 24, marginBottom: 12 }]}>
            To edit your tier list:
          </Text>
          <Text style={[styles.text, { fontSize: 16, lineHeight: 24, marginLeft: 16 }]}>
            • Scroll to the bottom of your rivalry page{'\n'}• Tap "Edit Tier List"{'\n'}• Drag
            characters to reorder them{'\n'}• Tap "Save" when finished
          </Text>
        </View>

        {/* Section 4: Resolve Contests */}
        <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: '#333', paddingTop: 20 }}>
          <Text
            style={[
              styles.text,
              { fontSize: 20, fontWeight: 'bold', color: '#6b21a8', marginBottom: 12 }
            ]}
          >
            4. Play Contests
          </Text>
          <Text style={[styles.text, { fontSize: 16, lineHeight: 24, marginBottom: 12 }]}>
            Boot up Super Smash Ultimate with these settings:
          </Text>
          <Text
            style={[
              styles.text,
              { fontSize: 16, lineHeight: 24, marginLeft: 16, marginBottom: 12 }
            ]}
          >
            • 3 Stock matches{'\n'}• Damage Handicap ON{'\n'}• Any other rules you prefer
          </Text>
          <Text style={[styles.text, { fontSize: 16, lineHeight: 24, marginBottom: 12 }]}>
            In the app:
          </Text>
          <Text
            style={[
              styles.text,
              { fontSize: 16, lineHeight: 24, marginLeft: 16, marginBottom: 12 }
            ]}
          >
            • Tap "Start New Contest"{'\n'}• You'll each be assigned a random character from your
            current tier{'\n'}• Apply the handicap shown (if any){'\n'}• Play the match!{'\n'}•
            Return to the app and select the winner and stock difference
          </Text>
        </View>

        {/* Section 5: Tier Movement */}
        <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: '#333', paddingTop: 20 }}>
          <Text
            style={[
              styles.text,
              { fontSize: 20, fontWeight: 'bold', color: '#6b21a8', marginBottom: 12 }
            ]}
          >
            5. How Tiers Change
          </Text>
          <Text style={[styles.text, { fontSize: 16, lineHeight: 24, marginBottom: 12 }]}>
            After each contest, players move between tiers based on the stock difference:
          </Text>
          <Text style={[styles.text, { fontSize: 16, lineHeight: 24, marginBottom: 8 }]}>
            <Text style={{ fontWeight: 'bold' }}>1 Stock Victory:</Text> Either the winner moves
            down one tier OR the loser moves up one tier (randomly chosen)
          </Text>
          <Text style={[styles.text, { fontSize: 16, lineHeight: 24, marginBottom: 8 }]}>
            <Text style={{ fontWeight: 'bold' }}>2 Stock Victory:</Text> Winner moves down one tier
            AND loser moves up one tier
          </Text>
          <Text style={[styles.text, { fontSize: 16, lineHeight: 24, marginBottom: 8 }]}>
            <Text style={{ fontWeight: 'bold' }}>3 Stock Victory:</Text> Both players move one tier,
            plus an additional tier move for either winner or loser (randomly chosen)
          </Text>
        </View>

        {/* Section 6: Character Rankings */}
        <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: '#333', paddingTop: 20 }}>
          <Text
            style={[
              styles.text,
              { fontSize: 20, fontWeight: 'bold', color: '#6b21a8', marginBottom: 12 }
            ]}
          >
            6. Character Movement Within Tiers
          </Text>
          <Text style={[styles.text, { fontSize: 16, lineHeight: 24 }]}>
            As contests are resolved, characters automatically move up or down within your tier list
            based on their performance. Winning characters rise in rank, while losing characters
            fall.
          </Text>
        </View>

        {/* Section 7: Prestige */}
        <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: '#333', paddingTop: 20 }}>
          <Text
            style={[
              styles.text,
              { fontSize: 20, fontWeight: 'bold', color: '#6b21a8', marginBottom: 12 }
            ]}
          >
            7. Prestige = Bragging Rights
          </Text>
          <Text style={[styles.text, { fontSize: 16, lineHeight: 24, marginBottom: 12 }]}>
            If a player moves below F Tier, he gains a Prestige level (shown as +1, +2, etc.). Each
            prestige level adds a 20% damage handicap against him.
          </Text>
          <Text style={[styles.text, { fontSize: 16, lineHeight: 24, marginBottom: 12 }]}>
            For example: If a player has +2 prestige over his rival, it means he'll have an
            approximately equal chance of winning or losing when playing with a 40% damage handicap.
            These are the bragging rights inherent in prestige!
          </Text>
          <Text style={[styles.text, { fontSize: 16, lineHeight: 24 }]}>
            If his rival thinks he is better, he will have to prove it by winning more to force the
            prestige down and remove the handicap. The handicap applies until the player is forced
            back up to his regular tier list.
          </Text>
        </View>

        {/* Section 8: Tips */}
        <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: '#333', paddingTop: 20 }}>
          <Text
            style={[
              styles.text,
              { fontSize: 20, fontWeight: 'bold', color: '#6b21a8', marginBottom: 12 }
            ]}
          >
            8. Tips & Features
          </Text>
          <Text style={[styles.text, { fontSize: 16, lineHeight: 24, marginBottom: 8 }]}>
            <Text style={{ fontWeight: 'bold' }}>Shuffle Characters:</Text> If you get a character
            you've banned or don't want to play, tap "Shuffle" to get new random characters from
            your current tier without counting as a contest.
          </Text>
          <Text style={[styles.text, { fontSize: 16, lineHeight: 24, marginBottom: 8 }]}>
            <Text style={{ fontWeight: 'bold' }}>Contest History:</Text> View all past contests and
            see how your rivalry has evolved. You can also undo the most recent contest if needed.
          </Text>
        </View>

        {/* Closing */}
        <View
          style={{
            marginTop: 32,
            marginBottom: 16,
            paddingTop: 20,
            borderTopWidth: 1,
            borderTopColor: '#333'
          }}
        >
          <Text
            style={[
              styles.text,
              { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 }
            ]}
          >
            Ready to Play?
          </Text>
          <Text style={[styles.text, { fontSize: 16, lineHeight: 24, textAlign: 'center' }]}>
            Now that you know the rules, create your first rivalry and experience Super Smash
            Ultimate in a whole new way!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
