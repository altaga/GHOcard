// Basic Imports
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { Component } from 'react';
import reactAutobind from 'react-autobind';
import { Dimensions, Image, View } from 'react-native';
import EncryptedStorage from 'react-native-encrypted-storage';
import logo from '../../assets/logo.png';
import GlobalStyles from "../../styles/styles";
import ContextModule from '../../utils/contextModule';

class SplashLoading extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    reactAutobind(this);
  }

  static contextType = ContextModule;

  async componentDidMount() {
    this.props.navigation.addListener('focus', async () => {
      // // DEBUG ONLY
      //await this.erase()
      console.log(this.props.route.name);
      //const ethAddress = await this.getAsyncStorageValue('ethAddress');
      this.props.navigation.navigate('Setup');
    });
    this.props.navigation.addListener('blur', async () => {});
  }

  async getAsyncStorageValue(value) {
    try {
      const session = await AsyncStorage.getItem('General');
      if (value in JSON.parse(session)) {
        return JSON.parse(session)[value];
      } else {
        return null;
      }
    } catch {
      return null;
    }
  }

  async erase() {
    // Debug Only
    try {
      await EncryptedStorage.clear();
      await AsyncStorage.clear();
    } catch (error) {
      console.log(error);
    }
  }

  render() {
    return (
      <View style={GlobalStyles.container}>
        <Image
          resizeMode="contain"
          source={logo}
          alt="Cat"
          style={{
            width: Dimensions.get('window').width * 0.4,
          }}
        />
      </View>
    );
  }
}

export default SplashLoading;
