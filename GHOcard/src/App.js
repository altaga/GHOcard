import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { StatusBar } from "react-native";
import { ContextProvider } from "./utils/contextModule";
import SplashLoading from "./screens/splashLoading/splashLoading";
import Setup from "./screens/setup/setup";
import Payment from "./screens/payment/payment";

const Stack = createNativeStackNavigator();

class App extends React.Component {
  async componentDidMount() {

  }
  render() {
    return (
      <ContextProvider>
        <NavigationContainer>
          <StatusBar barStyle="light-content" />
          <Stack.Navigator
            initialRouteName="SplashLoading"
            screenOptions={{
              headerShown: false,
            }}>
            <Stack.Screen name="SplashLoading" component={SplashLoading} />
            {
              // Setups
            }
            <Stack.Screen name="Setup" component={Payment} />
          </Stack.Navigator>
        </NavigationContainer>
      </ContextProvider>
    );
  }
}

export default App;
