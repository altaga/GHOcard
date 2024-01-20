import {
  NODE_ALCHEMY_KEY,
  NODE_APP_DESC,
  NODE_APP_LOGO,
  NODE_APP_NAME,
  NODE_APP_URL,
  NODE_AWS_URL,
  NODE_POS_ADDRESS,
  NODE_WC_ID,
} from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {UniversalProvider} from '@walletconnect/universal-provider';
import {ethers} from 'ethers';
import React, {Component} from 'react';
import reactAutobind from 'react-autobind';
import {Dimensions, Image, Linking, Pressable, Text, View} from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNPrint from 'react-native-print';
import QRCode from 'react-native-qrcode-svg';
import IconFAB from 'react-native-vector-icons/FontAwesome6';
import VirtualKeyboard from 'react-native-virtual-keyboard';
import {logo} from '../../assets/logo';
import logoPNG from '../../assets/logo.png';
import PressableEvent from '../../components/pressableEvent';
import ReadCard from '../../components/readCard';
import {ghoABI} from '../../contracts/ierc20-GHO';

function isNumber(string) {
  return !isNaN(parseFloat(string)) && isFinite(string);
}

function deleteLeadingZeros(string) {
  let number = parseFloat(string);
  let formattedString = number.toFixed(2).toString();
  return formattedString;
}

function formatInputText(inputText) {
  if (
    inputText === '0.00' ||
    inputText === '0' ||
    inputText === '00' ||
    inputText === '.' ||
    inputText === ''
  ) {
    return '0.00';
  } else if (isNumber(inputText) && !inputText.includes('.')) {
    return inputText + '.00';
  } else {
    if (inputText.includes('.')) {
      let zeroAttached = '';
      if (inputText.split('.')[0].length === 0) {
        zeroAttached = '0';
      }
      if (inputText.split('.')[1].length > 2) {
        return (
          zeroAttached +
          inputText.split('.')[0] +
          '.' +
          inputText.split('.')[1].substring(0, 2)
        );
      } else if (inputText.split('.')[1].length === 2) {
        return zeroAttached + inputText;
      } else if (inputText.split('.')[1].length === 1) {
        return zeroAttached + inputText + '0';
      } else {
        return zeroAttached + inputText + '00';
      }
    } else {
      return zeroAttached + inputText + '.00';
    }
  }
}

const BaseState = {
  // Wallet Connect
  qr: ' ',
  // Card
  text: '0.00', // "0.00"
  stage: 0, // 0
  card: true, // true
  cardInfo: null, // null
  tx: null, // null
  printData: '', // ''
};

export default class Payment extends Component {
  constructor(props) {
    super(props);
    this.state = BaseState;
    reactAutobind(this);
    this.svg = null;
    this.mount = true;
    this.connector = null;
  }

  async getDataURL() {
    return new Promise(async (resolve, reject) => {
      this.svg.toDataURL(async data => {
        this.setState(
          {
            printData: 'data:image/png;base64,' + data,
          },
          () => resolve('ok'),
        );
      });
    });
  }

  changeText(newText) {
    this.setState({text: newText});
  }

  async setStateAsync(value) {
    return new Promise(resolve => {
      this.mount &&
        this.setState(
          {
            ...value,
          },
          () => resolve(),
        );
    });
  }

  async payWithCrypto() {
    return new Promise(async (resolve, reject) => {
      var myHeaders = new Headers();
      myHeaders.append('Content-Type', 'application/json');

      var raw = JSON.stringify({
        amount: parseFloat(this.state.text),
        currency: 'GHO',
        address: NODE_POS_ADDRESS,
      });

      var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow',
      };

      fetch(
        `https://${NODE_AWS_URL}.execute-api.us-east-1.amazonaws.com/pay-with-card`,
        requestOptions,
      )
        .then(response => response.json())
        .then(async result => {
          const {tx} = result;
          const provider = new ethers.providers.JsonRpcProvider(
            `https://eth-sepolia.g.alchemy.com/v2/${NODE_ALCHEMY_KEY}`,
          );
          // Wait for the transaction to be mined
          await new Promise(resolve => {
            const interval = setInterval(async () => {
              const txReceipt = await provider.getTransactionReceipt(tx);
              if (txReceipt && txReceipt.blockNumber) {
                resolve(txReceipt);
                clearInterval(interval);
              }
            }, 1000);
          });
          // Update the state with the transaction hash
          this.setState({tx, stage: 3}, () => resolve('ok'));
        })
        .catch(error => console.log('error', error));
    });
  }

  // Wallet Connect Settings

  async setupWC() {
    this.connector = await UniversalProvider.init({
      projectId: NODE_WC_ID, // REQUIRED your projectId
      metadata: {
        name: NODE_APP_NAME,
        description: NODE_APP_DESC,
        url: NODE_APP_URL,
        icons: [NODE_APP_LOGO],
      },
    });

    this.connector.on('display_uri', uri => {
      console.log(uri);
      (this.state.qr === ' ' || this.state.stage === 0) &&
        this.mount &&
        this.setState({
          qr: uri,
          stage: 1,
          card: false,
        });
    });

    // Subscribe to session ping
    this.connector.on('session_ping', ({id, topic}) => {
      console.log('session_ping', id, topic);
    });

    // Subscribe to session event
    this.connector.on('session_event', ({event, chainId}) => {
      console.log('session_event', event, chainId);
    });

    // Subscribe to session update
    this.connector.on('session_update', ({topic, params}) => {
      console.log('session_update', topic, params);
    });

    // Subscribe to session delete
    this.connector.on('session_delete', ({id, topic}) => {
      console.log('session_delete', id, topic);
    });

    // session established
    this.connector.on('connect', async e => {
      const address = await this.connector.request(
        {
          method: 'eth_accounts',
          params: [],
        },
        'eip155:11155111',
      );
      await this.setStateAsync({
        account: address[0],
        stage: 2,
      });
      this.transferToken(
        address[0],
        NODE_POS_ADDRESS,
        '0xc4bf5cbdabe595361438f8c6a187bdc330539c60',
      );
    });
    // session disconnect
    this.connector.on('disconnect', async e => {
      console.log(e);
      console.log('Connection Disconnected');
    });
    this.connector
      .connect({
        namespaces: {
          eip155: {
            methods: ['eth_sendTransaction'],
            chains: ['eip155:11155111'],
            events: ['chainChanged', 'accountsChanged'],
            rpcMap: {},
          },
        },
      })
      .then(e => {
        console.log('Connection OK');
        console.log(e);
      })
      .catch(async e => {
        console.log(e);
        console.log('Connection Rejected');
        this.connector && this.cancelAndClearConnection();
        this.mount && this.setState(BaseState);
      });
  }

  async cancelAndClearConnection() {
    const topic = this.state.qr.substring(
      this.state.qr.indexOf('wc:') + 3,
      this.state.qr.indexOf('@'),
    );
    await this.connector.client.disconnect({
      topic,
      reason: getSdkError('USER_DISCONNECTED'),
    });
    await this.clearAsyncStorageWC();
    this.connector = null;
    delete this.connector;
  }

  async transferToken(from, to, tokenAddress) {
    try {
      const provider = new ethers.providers.JsonRpcProvider(
        `https://eth-sepolia.g.alchemy.com/v2/${NODE_ALCHEMY_KEY}`,
      );
      const web3Provider = new ethers.providers.Web3Provider(this.connector);
      const tokenContract = new ethers.Contract(tokenAddress, ghoABI, provider);
      const tokenDecimals = await tokenContract.decimals();
      const amount = ethers.utils.parseUnits(this.state.text, tokenDecimals);
      //const gasPrice = await provider.getGasPrice();
      const nonce = await provider.getTransactionCount(from, 'latest');
      let transaction = await tokenContract.populateTransaction.transfer(
        to,
        amount.toString(),
      );
      transaction = {
        ...transaction,
        from,
        nonce,
        value: '0x0',
        //gasPrice: gasPrice._hex,
      };
      const gas = await provider.estimateGas(transaction);
      transaction = {
        ...transaction,
        gas: gas._hex,
      };
      const result = await web3Provider.send('eth_sendTransaction', [
        transaction,
      ]);
      await provider.waitForTransaction(result);
      this.mount &&
        (await this.setStateAsync({
          tx: result,
          stage: 3,
        }));
    } catch (err) {
      console.log('Error on Transaction');
      console.log(err);
      this.mount && this.setState(BaseState);
    }
    console.log('Clear Connection');
    this.connector && this.cancelAndClearConnection();
  }

  async clearAsyncStorageWC() {
    await AsyncStorage.multiRemove([
      'wc@2:client:0.3//proposal',
      'wc@2:client:0.3//session',
      'wc@2:core:0.3//expirer',
      'wc@2:core:0.3//history',
      'wc@2:core:0.3//keychain',
      'wc@2:core:0.3//messages',
      'wc@2:core:0.3//pairing',
      'wc@2:core:0.3//subscription',
      'wc@2:universal_provider:/namespaces',
      'wc@2:universal_provider:/optionalNamespaces',
      'wc@2:universal_provider:/sessionProperties',
    ]);
  }

  componentDidMount() {
    this.props.navigation.addListener('focus', async () => {
      this.mount = true;
      this.mount && this.setState(BaseState);
    });
    this.props.navigation.addListener('blur', async () => {
      this.connector && this.cancelAndClearConnection();
      this.mount && this.setState(BaseState);
      this.mount = false;
    });
  }

  async componentWillUnmount() {
    this.connector && this.cancelAndClearConnection();
    this.mount && this.setState(BaseState);
    this.mount = false;
  }

  render() {
    return (
      <>
        <View style={{flex: 1, backgroundColor: 'black'}}>
          <View
            style={{
              height: 60,
              flexDirection: 'row',
              justifyContent: 'space-around',
              alignItems: 'center',
            }}>
            <Image source={logoPNG} style={{width: 40, height: 40}} />
            <Text
              style={{
                fontSize: 32,
                color: 'white',
                fontWeight: 'bold',
                fontStyle: 'italic',
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: 2,
                textShadowColor: 'white',
                textShadowOffset: {width: -1, height: 0},
                textShadowRadius: 10,
              }}>
              GHOcard POS
            </Text>
          </View>
          {this.state.stage === 0 && (
            <View
              style={{
                flex: Dimensions.get('window').height - 100,
                justifyContent: 'space-evenly',
                alignItems: 'center',
              }}>
              <Text style={{fontSize: 16, color: 'white'}}>Enter Amount:</Text>
              <Text style={{fontSize: 36, color: 'white'}}>
                {deleteLeadingZeros(formatInputText(this.state.text))}
              </Text>
              <VirtualKeyboard
                style={{
                  width: '80vw',
                  fontSize: 40,
                  textAlign: 'center',
                  marginTop: -10,
                }}
                cellStyle={{
                  width: 50,
                  height: 50,
                  borderWidth: 1,
                  borderColor: '#77777777',
                  borderRadius: 5,
                  margin: 1,
                }}
                color="white"
                pressMode="string"
                onPress={val => this.changeText(val)}
                decimal
              />
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-evenly',
                  width: Dimensions.get('window').width,
                }}>
                <Pressable
                  style={{
                    padding: 10,
                    backgroundColor: 'white',
                    borderWidth: 1,
                    borderColor: 'black',
                    borderRadius: 5,
                    width: Dimensions.get('window').width / 2.3,
                    alignItems: 'center',
                  }}
                  onPress={() => this.setState({stage: 1, card: true})}>
                  <Text
                    style={{color: 'black', fontWeight: 'bold', fontSize: 20}}>
                    Pay with Card
                  </Text>
                </Pressable>
                <PressableEvent
                  hover
                  style={{
                    padding: 10,
                    backgroundColor: 'white',
                    borderWidth: 1,
                    borderColor: 'black',
                    borderRadius: 5,
                    width: Dimensions.get('window').width / 2.3,
                    alignItems: 'center',
                  }}
                  styleHover={{
                    backgroundColor: '#333333ff',
                  }}
                  onPress={async () => await this.setupWC()}>
                  <Text
                    style={{color: 'black', fontWeight: 'bold', fontSize: 20}}>
                    Pay with QR
                  </Text>
                </PressableEvent>
              </View>
            </View>
          )}
          {this.state.card ? (
            <>
              {this.state.stage === 1 && (
                <>
                  <View
                    style={{
                      justifyContent: 'space-evenly',
                      alignItems: 'center',
                    }}>
                    <Text style={{fontSize: 16, color: 'white', marginTop: 20}}>
                      Amount
                    </Text>
                    <Text style={{fontSize: 36, color: 'white'}}>
                      $ {deleteLeadingZeros(formatInputText(this.state.text))}
                    </Text>
                  </View>
                  <ReadCard
                    cardInfo={cardInfo => {
                      if (cardInfo) {
                        this.setState({stage: 2, cardInfo});
                      }
                    }}
                  />
                </>
              )}
              {this.state.stage === 2 && (
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'space-evenly',
                    alignItems: 'center',
                  }}>
                  <PressableEvent
                    hover
                    style={{
                      padding: 10,
                      backgroundColor: 'white',
                      borderWidth: 1,
                      borderColor: 'black',
                      borderRadius: 5,
                      width: Dimensions.get('window').width / 1.5,
                      height: Dimensions.get('window').height / 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    styleHover={{
                      backgroundColor: '#333333ff',
                    }}
                    onPress={async () => await this.payWithCrypto()}>
                    <Text
                      style={{
                        color: 'black',
                        fontWeight: 'bold',
                        fontSize: 24,
                      }}>
                      Pay with GHO
                    </Text>
                  </PressableEvent>
                  <Pressable
                    hover
                    style={{
                      padding: 10,
                      backgroundColor: 'white',
                      borderWidth: 1,
                      borderColor: 'black',
                      borderRadius: 5,
                      width: Dimensions.get('window').width / 1.5,
                      height: Dimensions.get('window').height / 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    styleHover={{
                      backgroundColor: '#333333ff',
                    }}
                    onPress={() => this.setState({stage: 3})}>
                    <Text
                      style={{
                        color: 'black',
                        fontWeight: 'bold',
                        fontSize: 24,
                      }}>
                      Pay with $USD
                    </Text>
                  </Pressable>
                </View>
              )}
              {this.state.stage === 3 && (
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'space-evenly',
                    alignItems: 'center',
                  }}>
                  <Text style={{fontSize: 36, color: 'white'}}>
                    Payment Success
                  </Text>
                  <Pressable
                    style={{
                      padding: 10,
                      backgroundColor: 'white',
                      borderWidth: 1,
                      borderColor: 'black',
                      borderRadius: 5,
                      width: Dimensions.get('window').width / 1.5,
                      height: Dimensions.get('window').height / 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    onPress={() =>
                      Linking.openURL(
                        `https://sepolia.etherscan.io/tx/${this.state.tx}`,
                      )
                    }>
                    <Text
                      style={{
                        color: 'black',
                        fontWeight: 'bold',
                        fontSize: 20,
                      }}>
                      Open Explorer
                    </Text>
                  </Pressable>
                  <PressableEvent
                    hover
                    style={{
                      padding: 10,
                      backgroundColor: 'white',
                      borderWidth: 1,
                      borderColor: 'black',
                      borderRadius: 5,
                      width: Dimensions.get('window').width / 1.5,
                      height: Dimensions.get('window').height / 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    styleHover={{
                      backgroundColor: '#333333ff',
                    }}
                    onPress={async () => {
                      await this.getDataURL();
                      const results = await RNHTMLtoPDF.convert({
                        html: `
                            <div style="text-align: center;">
                                <img src='${logo}' width="400px"></img>
                                <h1 style="font-size: 3rem;">--------- Original Reciept ---------</h1>
                                <h1 style="font-size: 3rem;">Date: ${new Date().toLocaleDateString()}</h1>
                                <h1 style="font-size: 3rem;">Type: Debit Card</h1>
                                <h1 style="font-size: 3rem;">------------------ • ------------------</h1>
                                <h1 style="font-size: 3rem;">Transaction</h1>
                                <h1 style="font-size: 3rem;">Amount: ${deleteLeadingZeros(
                                  formatInputText(this.state.text),
                                )} ${'GHO'}</h1>
                                <h1 style="font-size: 3rem;">------------------ • ------------------</h1>
                                <img src='${this.state.printData}'></img>
                            </div>
                            `,
                        fileName: 'print',
                        base64: true,
                      });
                      await RNPrint.print({filePath: results.filePath});
                    }}>
                    <Text
                      style={{
                        color: 'black',
                        fontWeight: 'bold',
                        fontSize: 20,
                      }}>
                      Print Receipt
                    </Text>
                  </PressableEvent>
                  <Pressable
                    style={{
                      padding: 10,
                      backgroundColor: 'white',
                      borderWidth: 1,
                      borderColor: 'black',
                      borderRadius: 5,
                      width: Dimensions.get('window').width / 1.5,
                      height: Dimensions.get('window').height / 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    onPress={() => {
                      this.connector && this.cancelAndClearConnection();
                      this.mount && this.setState(BaseState);
                    }}>
                    <Text
                      style={{
                        color: 'black',
                        fontWeight: 'bold',
                        fontSize: 20,
                      }}>
                      Return
                    </Text>
                  </Pressable>
                </View>
              )}
            </>
          ) : (
            <>
              {this.state.stage === 1 && (
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'space-evenly',
                    alignItems: 'center',
                  }}>
                  <Text style={{fontSize: 24, color: 'white'}}>
                    Scan with your wallet
                  </Text>
                  <View
                    style={{
                      width: Dimensions.get('window').width * 0.9,
                      height: Dimensions.get('window').width * 0.9,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: 'white',
                      borderRadius: 10,
                    }}>
                    <QRCode
                      value={this.state.qr}
                      size={Dimensions.get('window').width * 0.8}
                      ecl="L"
                    />
                  </View>
                </View>
              )}
              {this.state.stage === 2 && (
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'space-evenly',
                    alignItems: 'center',
                  }}>
                  <Text style={{fontSize: 24, color: 'white'}}>
                    Sign with your wallet...
                  </Text>
                  <IconFAB name="wallet" size={240} color="white" />
                </View>
              )}
              {this.state.stage === 3 && (
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'space-evenly',
                    alignItems: 'center',
                  }}>
                  <Text style={{fontSize: 36, color: 'white'}}>
                    Payment Success
                  </Text>
                  <Pressable
                    style={{
                      padding: 10,
                      backgroundColor: 'white',
                      borderWidth: 1,
                      borderColor: 'black',
                      borderRadius: 5,
                      width: Dimensions.get('window').width / 1.5,
                      height: Dimensions.get('window').height / 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    onPress={() =>
                      Linking.openURL(
                        `https://sepolia.etherscan.io/tx/${this.state.tx}`,
                      )
                    }>
                    <Text
                      style={{
                        color: 'black',
                        fontWeight: 'bold',
                        fontSize: 20,
                      }}>
                      Open Explorer
                    </Text>
                  </Pressable>
                  <PressableEvent
                    hover
                    style={{
                      padding: 10,
                      backgroundColor: 'white',
                      borderWidth: 1,
                      borderColor: 'black',
                      borderRadius: 5,
                      width: Dimensions.get('window').width / 1.5,
                      height: Dimensions.get('window').height / 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    styleHover={{
                      backgroundColor: '#333333ff',
                    }}
                    onPress={async () => {
                      await this.getDataURL();
                      const results = await RNHTMLtoPDF.convert({
                        html: `
                            <div style="text-align: center;">
                                <img src='${logo}' width="400px"></img>
                                <h1 style="font-size: 3rem;">--------- Original Reciept ---------</h1>
                                <h1 style="font-size: 3rem;">Date: ${new Date().toLocaleDateString()}</h1>
                                <h1 style="font-size: 3rem;">Type: Wallet Connect</h1>
                                <h1 style="font-size: 3rem;">------------------ • ------------------</h1>
                                <h1 style="font-size: 3rem;">Transaction</h1>
                                <h1 style="font-size: 3rem;">Amount: ${deleteLeadingZeros(
                                  formatInputText(this.state.text),
                                )} ${'GHO'}</h1>
                                <h1 style="font-size: 3rem;">------------------ • ------------------</h1>
                                <img src='${this.state.printData}'></img>
                            </div>
                            `,
                        fileName: 'print',
                        base64: true,
                      });
                      await RNPrint.print({filePath: results.filePath});
                    }}>
                    <Text
                      style={{
                        color: 'black',
                        fontWeight: 'bold',
                        fontSize: 20,
                      }}>
                      Print Receipt
                    </Text>
                  </PressableEvent>
                  <Pressable
                    style={{
                      padding: 10,
                      backgroundColor: 'white',
                      borderWidth: 1,
                      borderColor: 'black',
                      borderRadius: 5,
                      width: Dimensions.get('window').width / 1.5,
                      height: Dimensions.get('window').height / 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    onPress={() => {
                      this.connector && this.cancelAndClearConnection();
                      this.mount && this.setState(BaseState);
                    }}>
                    <Text
                      style={{
                        color: 'black',
                        fontWeight: 'bold',
                        fontSize: 20,
                      }}>
                      Return
                    </Text>
                  </Pressable>
                </View>
              )}
            </>
          )}
        </View>
        <View style={{position: 'absolute', bottom: -1000}}>
          <QRCode
            value={`https://sepolia.etherscan.io/tx/${this.state.tx}`}
            size={Dimensions.get('window').width * 0.7}
            ecl="L"
            getRef={c => (this.svg = c)}
          />
        </View>
      </>
    );
  }
}
