import React from 'react';
import {
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
const KeyboardAwareScrollViewComponent = props => {
  return (
    <SafeAreaView style={styles.inner}>
      <KeyboardAwareScrollView showsVerticalScrollIndicator={false}>
        <SafeAreaView style={styles.inner}>{props.children}</SafeAreaView>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  inner: {
    flex: 1
  },
});
export default KeyboardAwareScrollViewComponent;
