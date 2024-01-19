import {Dimensions, Platform, StatusBar, StyleSheet} from 'react-native';

const header = 70;
const footer = 60;

export const main = Dimensions.get('window').height - (header + footer);

const screenHeight = Dimensions.get('screen').height;
const windowHeight = Dimensions.get('window').height;

export const StatusBarHeight = StatusBar.currentHeight;
export const NavigatorBarHeight = screenHeight - windowHeight;

const API = parseInt(Platform.constants['Release']);

const GlobalStyles = StyleSheet.create({
  // Globals Layout
  container: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#222222',
  },
  header: {
    height: header,
    width: Dimensions.get('window').width,
  },
  main: {
    height: main,
    width: Dimensions.get('window').width,
  },
  footer: {
    width: Dimensions.get('window').width,
    height: footer,
  },
});

export default GlobalStyles;
