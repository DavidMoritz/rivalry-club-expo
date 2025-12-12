import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    height: '100%'
  },
  gameLogoImage: {
    alignSelf: 'center',
    height: 160,
    resizeMode: 'contain',
    width: '95%'
  },
  text: {
    fontSize: 14,
    color: 'white'
  },
  title: {
    color: 'aqua',
    fontSize: 50,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'black',
    textShadowOffset: {
      width: 2,
      height: 2
    },
    textShadowRadius: 1
  }
});

export const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    color: 'white'
  },
  text: { color: 'white' }
});

export const contestStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5
  },
  item: {
    flex: 1,
    alignItems: 'center'
  }
});
