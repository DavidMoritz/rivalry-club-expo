import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  btnGroup: {
    marginVertical: 5,
  },
  container: {
    height: '100%',
  },
  contestRow: {
    flexDirection: 'row',
  },
  currentContestUser: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  fighterText: {
    alignItems: 'center',
    flex: 1,
    fontWeight: 'bold',
    justifyContent: 'center',
    width: '100%',
    color: 'white',
  },
  fighterWrapper: {
    alignItems: 'center',
    height: 150,
    justifyContent: 'space-between',
    marginVertical: 0,
    marginHorizontal: 0,
    width: '33.33%',
  },
  fightersContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  gameLogoImage: {
    alignSelf: 'center',
    height: 160,
    marginVertical: 10,
    resizeMode: 'contain',
    shadowColor: 'white',
    shadowOpacity: 1,
    shadowRadius: 7,
    width: '95%',
  },
  loadingSpinner: {},
  // only use this in development
  obnoxious: {
    backgroundColor: 'aqua',
    borderColor: 'green',
    borderWidth: 2,
  },
  obnoxious2: {
    backgroundColor: 'pink',
    borderColor: 'blue',
    borderWidth: 2,
  },
  obnoxious3: {
    backgroundColor: 'purple',
    borderColor: 'orange',
    borderWidth: 2,
  },
  rivalryRow: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 15,
  },
  siteLogoImage: {
    alignSelf: 'center',
    aspectRatio: 1,
    flex: 1,
    resizeMode: 'contain',
  },
  text: {
    fontSize: 14,
    color: 'white',
  },
  tierFighters: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  tierFightersContainer: {
    flex: 0,
    flexBasis: 320,
    flexGrow: 0,
    flexShrink: 0,
  },
  tierLetter: {
    color: 'black',
    fontSize: 24,
  },
  tierLetterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0,
    flexBasis: 50,
    flexGrow: 0,
    flexShrink: 0,
  },
  tierListFightersContainer: {
    alignItems: 'flex-end',
    width: '100%',
    height: 220,
  },
  tierRow: {
    borderColor: '#fff',
    borderStyle: 'solid',
    borderWidth: 2,
    flexDirection: 'row',
    width: '100%',
  },
  tierRowActive: {
    borderColor: '#f00',
    borderWidth: 4,
  },
  title: {
    color: 'aqua',
    fontSize: 50,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'black',
    textShadowOffset: {
      width: 2,
      height: 2,
    },
    textShadowRadius: 1,
  },
  titleContainer: {
    alignItems: 'center',
    bottom: 20,
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
  },
  viewLower: { flex: 3 },
  viewUpper: { flex: 1, alignItems: 'center', justifyContent: 'space-between', width: '100%' },
});

export const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    color: 'white',
  },
  text: { color: 'white' },
});

export const lightStyles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f8f8',
    color: 'black',
  },
  text: { color: 'black' },
});

export const contestStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  winner: {
    backgroundColor: 'hsl(150, 100%, 13%)',
  },
  fighter: {
    height: 40,
  },
  tableHeader: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  tableHeaderRow: {
    borderBottomWidth: 2,
    borderBottomColor: 'yellow',
  },
  tableWrapper: {
    padding: 10,
  },
});

export function containerStyle(isDarkMode = false, reverse = false) {
  const isDark = reverse ? !isDarkMode : isDarkMode;

  return StyleSheet.compose(
    styles.text,
    isDark ? darkStyles.container : lightStyles.container,
  );
}
