import React, {Component} from 'react';
import {Pressable} from 'react-native';

export default class PressableEvent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pressed: false,
    };
  }

  onPress = () => {
    if (!this.state.pressed) {
      this.setState({pressed: true}, async () => {
        await this.props.onPress();
        this.setState({pressed: false});
      });
    }
  };

  render() {
    const hover = this.props.hover ? this.props.styleHover : {};
    return (
      <Pressable
        {...this.props}
        style={[
          this.props.style,
          this.state.pressed && {...hover},
        ]}
        onPress={this.onPress}>
        {this.props.children}
      </Pressable>
    );
  }
}
