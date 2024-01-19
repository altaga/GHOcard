import {Dimensions, Image, Linking, Pressable, Text, View} from 'react-native';
import React, {Component} from 'react';
import VirtualKeyboard from 'react-native-virtual-keyboard';
import ReadCard from '../../components/readCard';
import {ethers} from 'ethers';
import PressableEvent from '../../components/pressableEvent';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNPrint from 'react-native-print';
import QRCode from 'react-native-qrcode-svg';
import {logo} from '../../assets/logo';
import logoPNG from '../../assets/logo.png';
import reactAutobind from 'react-autobind';
import {
  NODE_ALCHEMY_KEY,
  NODE_AWS_URL,
  NODE_WC_ID,
  NODE_APP_NAME,
  NODE_APP_DESC,
} from '@env';
import {UniversalProvider} from '@walletconnect/universal-provider';

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
  qr: null,
  paymentStatus: 'Processing...',
  loading: false,
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

  async payWithCrypto() {
    return new Promise(async (resolve, reject) => {
      var myHeaders = new Headers();
      myHeaders.append('Content-Type', 'application/json');

      var raw = JSON.stringify({
        amount: parseFloat(this.state.text),
        currency: 'GHO',
        address: '0x2eD503A5690849a935F0bf3483759B549D7976E6',
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
        url: 'http://effisend.com/',
        icons: ['https://i.ibb.co/HpqQFrJ/logo-Stroke.png'],
      },
    });

    this.connector.on('display_uri', uri => {
      console.log(uri);
      (this.state.qr === null || this.state.stage === 0) &&
        this.mount &&
        this.setState({
          qr: uri,
          stage: 1,
          loading: false,
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
        'eip155:' + this.state.networkSelected.chainId.toString(),
      );
      await this.setStateAsync({
        account: address[0],
        stage: 2,
      });
      this.createTransaction();
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
            chains: ['eip155:' + this.state.networkSelected.chainId.toString()],
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
        this.mount && this.setState(WalletConnectDepositBaseState);
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
                  onPress={() => this.setState({stage: 1, card: false})}>
                  <Text
                    style={{color: 'black', fontWeight: 'bold', fontSize: 20}}>
                    Pay with QR
                  </Text>
                </Pressable>
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
                </View>
              )}
            </>
          ) : (
            <></>
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
