import React, { Component } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';

import './App.scss';

import Token from './token/Token.jsx';
import Ads from './ads/Ads.jsx';
import Message from './message/Message.jsx';

class App extends Component {
  
  constructor(props) {
    super(props);
    this.state = {
      authorized: false,
    };
  }

  saveToken = (token) => {
    this.setState({
      authorized: true,
      token,
    });
  }

  showMessage = (message, variant) => {
    this.setState({
      message: {
        text: message,
        variant,
        key: new Date().getTime(),
      }
    });
  }

  render(){
    let { authorized, message } = this.state;
    return(
      <div className="App">
        <CssBaseline/>
        { !authorized && 
            <Token
              onAuthorized={this.saveToken}
              onError={(error) => this.showMessage(error, 'error')}
            />
        }
        { authorized &&
            <Ads
              token={this.state.token}
              onSaved={() => this.showMessage('Реклама сохранена', 'success')}
              onError={(error) => this.showMessage(error, 'error')}
            />
        }        
        <Message message={message}/>
      </div>
    );
  }
}

export default App;
