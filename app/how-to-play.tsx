import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/common/Button';
import { HamburgerMenu } from '../src/components/common/HamburgerMenu';
import { colors } from '../src/utils/colors';
import { bold, center, darkStyles, styles } from '../src/utils/styles';

export default function HowToPlay() {
  const router = useRouter();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.container, darkStyles.container]}>
      <HamburgerMenu />

      <ScrollView contentContainerStyle={scrollContentStyle} style={scrollViewStyle}>
        {/* Header */}
        <View style={headerContainerStyle}>
          <Text style={titleTextStyle}>Rivalry Club</Text>
          <Text style={subtitleTextStyle}>How to Play</Text>
          <Button onPress={() => router.push('/')} style={homeButtonStyle} text="← Home" />
        </View>

        {/* Introduction */}
        <View style={sectionContainerTopStyle}>
          <Text style={headerTextStyle}>Welcome to Rivalry Club!</Text>
          <Text style={bodyTextWithMarginStyle}>
            Challenge your rival with customized, auto-balancing tier lists! Learn this exciting new
            way to play your favorite fighting game.
          </Text>
        </View>

        {/* Section 1: Create an Account */}
        <View style={sectionContainerStyle}>
          <Text style={sectionTitleStyle}>1. Create an Account</Text>
          <Text style={bodyTextStyle}>
            First, you and your rival must create accounts. Tap "Sign Up" on the authentication
            screen to get started.
          </Text>
        </View>

        {/* Section 2: Start a Rivalry */}
        <View style={sectionContainerStyle}>
          <Text style={sectionTitleStyle}>2. Start a Rivalry</Text>
          <Text style={bodyTextWithBottomMarginStyle}>After creating your accounts:</Text>
          <Text style={bulletTextStyle}>
            • Tap "Create New Rivalry" \n • Search for and select your opponent \n • Choose your
            game (currently Super Smash Ultimate) \n • Your tier lists start empty, but you can edit
            immediately
          </Text>
          <Text style={proTipTextStyle}>
            Pro Tip: Type "npc" in the search to instantly find test opponents and try out Rivalry
            Club solo!
          </Text>
        </View>

        {/* Section 3: Edit Your Tier List */}
        <View style={sectionContainerStyle}>
          <Text style={sectionTitleStyle}>3. Edit Your Tier List</Text>
          <Text style={bodyTextWithBottomMarginStyle}>
            Most tiers (S, A, B, C, D, E) contain 12 characters, while F Tier contains 14
            characters. Rank characters from your best in S Tier down to your worst in F Tier.
          </Text>
          <Text style={bodyTextWithBottomMarginStyle}>To edit your tier list:</Text>
          <Text style={bulletTextNoBtmMarginStyle}>
            • Tap "View Tier Lists" on your rivalry page \n • Tap "Edit Tier List" \n • Tap a
            character icon, then tap the spot where you want it to go \n • Tap "Save List" when
            finished
          </Text>
        </View>

        {/* Section 4: Resolve Contests */}
        <View style={sectionContainerStyle}>
          <Text style={sectionTitleStyle}>4. Play Contests</Text>
          <Text style={bodyTextWithBottomMarginStyle}>
            Boot up Super Smash Ultimate with these settings:
          </Text>
          <Text style={bulletTextStyle}>
            • 3 Stock matches \n • Damage Handicap ON \n • Any other rules you prefer
          </Text>
          <Text style={bodyTextWithBottomMarginStyle}>In the app:</Text>
          <Text style={bulletTextStyle}>
            • Tap "Create new contest" \n • You'll each be assigned an unplaced character or a
            random character from your current tier \n • Apply the handicap shown (if any) \n • Play
            the match! \n • Return to the app and select the winner and stock difference
          </Text>
        </View>

        {/* Section 5: Tier Movement */}
        <View style={sectionContainerStyle}>
          <Text style={sectionTitleStyle}>5. How Tiers Change</Text>
          <Text style={bodyTextWithBottomMarginStyle}>
            After each contest, players move between tiers based on the stock difference:
          </Text>
          <Text style={ruleTextStyle}>
            <Text style={boldTextStyle}>1 Stock Victory:</Text> Either the winner moves down one
            tier OR the loser moves up one tier (randomly chosen)
          </Text>
          <Text style={ruleTextStyle}>
            <Text style={boldTextStyle}>2 Stock Victory:</Text> Winner moves down one tier AND loser
            moves up one tier
          </Text>
          <Text style={ruleTextStyle}>
            <Text style={boldTextStyle}>3 Stock Victory:</Text> Both players move one tier, plus an
            additional tier move for either winner or loser (randomly chosen)
          </Text>
        </View>

        {/* Section 6: Character Rankings */}
        <View style={sectionContainerStyle}>
          <Text style={sectionTitleStyle}>6. Character Movement Within Tiers</Text>
          <Text style={bodyTextStyle}>
            As contests are resolved, characters automatically move up or down within your tier list
            based on their performance. Winning characters rise in rank, while losing characters
            fall.
          </Text>
        </View>

        {/* Section 7: Prestige */}
        <View style={sectionContainerStyle}>
          <Text style={sectionTitleStyle}>7. Prestige = Bragging Rights</Text>
          <Text style={bodyTextWithBottomMarginStyle}>
            If a player moves below F Tier, he gains a Prestige level (shown as +1, +2, etc.). Each
            prestige level adds a 20% damage handicap against him.
          </Text>
          <Text style={bodyTextWithBottomMarginStyle}>
            For example: If a player has +2 prestige over his rival, it means he'll have an
            approximately equal chance of winning or losing when playing with a 40% damage handicap.
            These are the bragging rights inherent in prestige!
          </Text>
          <Text style={bodyTextStyle}>
            If his rival thinks he is better, he will have to prove it by winning more to force the
            prestige down and remove the handicap. The handicap applies until the player is forced
            back up to his regular tier list.
          </Text>
        </View>

        {/* Section 8: Tips */}
        <View style={sectionContainerStyle}>
          <Text style={sectionTitleStyle}>8. Tips & Features</Text>
          <Text style={tipTextStyle}>
            <Text style={boldTextStyle}>Shuffle Characters:</Text> If you get a character you've
            banned or don't want to play, tap "Shuffle" to get a new random character from your
            current tier, or unknown tier, without counting as a contest.
          </Text>
          <Text style={tipTextStyle}>
            <Text style={boldTextStyle}>Contest History:</Text> View all past contests and see how
            your rivalry has evolved. You can also undo the most recent contest if needed.
          </Text>
        </View>

        {/* Closing */}
        <View style={closingContainerStyle}>
          <Text style={closingTitleStyle}>Ready to Play?</Text>
          <Text style={closingBodyStyle}>
            Now that you know the rules, create your first rivalry and experience Super Smash
            Ultimate in a whole new way!
          </Text>
          <View style={closingButtonContainerStyle}>
            <Button onPress={() => router.push('/')} style={homeButtonStyle} text="← Home" />
            <Button
              onPress={() => router.push('/offline')}
              style={homeButtonStyle}
              text="Offline?"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const italic = 'italic' as const;

const scrollViewStyle = {
  flex: 1
};

const scrollContentStyle = {
  paddingHorizontal: 16,
  paddingBottom: 32
};

const headerContainerStyle = {
  paddingVertical: 24,
  alignItems: center,
  borderBottomWidth: 1,
  borderBottomColor: colors.gray750
};

const titleTextStyle = {
  ...styles.text,
  fontSize: 32,
  fontWeight: bold,
  marginBottom: 8
};

const subtitleTextStyle = {
  ...styles.text,
  fontSize: 16,
  color: colors.purple500
};

const homeButtonStyle = {
  marginTop: 16,
  width: 140,
  paddingVertical: 0
};

const sectionContainerTopStyle = {
  marginTop: 24
};

const sectionContainerStyle = {
  marginTop: 24,
  borderTopWidth: 1,
  borderTopColor: colors.gray750,
  paddingTop: 20
};

const sectionTitleStyle = {
  ...styles.text,
  fontSize: 20,
  fontWeight: bold,
  color: colors.purple500,
  marginBottom: 12
};

const headerTextStyle = {
  ...styles.text,
  fontSize: 18,
  fontWeight: bold,
  marginBottom: 12
};

const bodyTextStyle = {
  ...styles.text,
  fontSize: 16,
  lineHeight: 24
};

const bodyTextWithBottomMarginStyle = {
  ...bodyTextStyle,
  marginBottom: 12
};

const bodyTextWithMarginStyle = {
  ...bodyTextStyle,
  marginBottom: 16
};

const bulletTextStyle = {
  ...bodyTextStyle,
  marginLeft: 16,
  marginBottom: 12
};

const bulletTextNoBtmMarginStyle = {
  ...bodyTextStyle,
  marginLeft: 16
};

const proTipTextStyle = {
  ...bodyTextStyle,
  fontStyle: italic,
  color: colors.purple300
};

const ruleTextStyle = {
  ...bodyTextStyle,
  marginBottom: 8
};

const tipTextStyle = {
  ...bodyTextStyle,
  marginBottom: 8
};

const boldTextStyle = {
  fontWeight: bold
};

const closingContainerStyle = {
  marginTop: 32,
  marginBottom: 16,
  paddingTop: 20,
  borderTopWidth: 1,
  borderTopColor: colors.gray750
};

const closingTitleStyle = {
  ...styles.text,
  fontSize: 18,
  fontWeight: bold,
  textAlign: center,
  marginBottom: 12
};

const closingBodyStyle = {
  ...styles.text,
  fontSize: 16,
  lineHeight: 24,
  textAlign: center,
  marginBottom: 20
};

const closingButtonContainerStyle = {
  alignItems: center
};
