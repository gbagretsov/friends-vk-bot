import React, { Component } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';

import './App.scss';

import Token from './token/Token.jsx';
import Ads from './ads/Ads.jsx';
import Message from './message/Message.jsx';
import Words from './words/Words.jsx';

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
  };

  showMessage = (message, variant) => {
    this.setState({
      message: {
        text: message,
        variant,
        key: new Date().getTime(),
      }
    });
  };

  renderAdminPanel = () => {
    return(
      <div>
        <Ads
          token={this.state.token}
          onSaved={() => this.showMessage('Реклама сохранена', 'success')}
          onError={(error) => this.showMessage(error, 'error')}
        />
        <Words
          token={this.state.token}
          onWordAdded={(word) => this.showMessage(`Добавлено слово "${word.name}"`, 'success')}
          onWordChanged={(word) => this.showMessage(`Слово "${word.oldName}" изменено на "${word.newName}"`, 'success')}
          onWordDeleted={(word) => this.showMessage(`Слово "${word.name}" удалено`, 'success')}
          onWordApproved={(word) => this.showMessage(`Слово "${word.name}" одобрено`, 'success')}
          onError={(error) => this.showMessage(error, 'error')}
        />
      </div>
    );
  };

  render(){
    let { authorized, message } = this.state;
    return(
      <div className="App">
        <CssBaseline/>
        { !authorized && 
            <Token
              onAuthorized={(token, demo) => {
                this.saveToken(token);
                if (demo) {
                  this.showMessage('Вы находитесь в демо-режиме. Изменения не сохраняются', 'info');
                }
              }}
              onError={(error) => this.showMessage(error, 'error')}
            />
        }
        { authorized && this.renderAdminPanel() }        
        <Message message={message}/>
      </div>
    );
  }
}

export default App;
