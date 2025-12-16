import { StyleSheet } from 'react-native';
import { colors } from './colors';

// Common style value constants
export const center = 'center' as const;
export const bold = 'bold' as const;
export const row = 'row' as const;
export const wrap = 'wrap' as const;
export const absolute = 'absolute' as const;
export const relative = 'relative' as const;

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
    color: colors.white
  },
  title: {
    color: 'aqua',
    fontSize: 50,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: colors.black,
    textShadowOffset: {
      width: 2,
      height: 2
    },
    textShadowRadius: 1
  }
});

export const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray900,
    color: colors.white
  },
  text: { color: colors.white }
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
