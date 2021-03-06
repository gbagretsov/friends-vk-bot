import React, { Component } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import './App.scss';

import Token from './token/Token.jsx';
import Ads from './ads/Ads.jsx';
import Message from './message/Message.jsx';
import Words from './words/Words.jsx';
import CustomReactions from './custom-reactions/CustomReactions';

class App extends Component {
  
  constructor(props) {
    super(props);
    this.state = {
      authorized: false,
      tab: 0,
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

  setTab = (tab) => {
    this.setState({
      tab
    });
  };

  renderAdminPanel = () => {
    return(
      <div>
        { this.state.tab === 0 && this.renderMainTab() }
        { this.state.tab === 1 && <CustomReactions
          token={this.state.token}
          onReactionSaved={(reaction) => this.showMessage(`Реакция "${reaction.name}" сохранена`, 'success')}
          onReactionDeleted={(reaction) => this.showMessage(`Реакция "${reaction.name}" удалена`, 'success')}
          onError={(error) => this.showMessage(error, 'error')}/>
        }
      </div>
    );
  };

  renderMenu = () => {
    return(
      <AppBar position="static">
        <Tabs onChange={(event, tab) => this.setTab(tab)} value={this.state.tab}>
          <Tab label="Главная"/>
          <Tab label="Пользовательские реакции"/>
        </Tabs>
      </AppBar>
    );
  };

  renderMainTab = () => {
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
  }

  render(){
    let { authorized, message } = this.state;
    return(
      <div>
        <CssBaseline/>
        { authorized && this.renderMenu() }
        <div className="App">
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
        </div>
        <Message message={message}/>
      </div>
    );
  }
}

export default App;
