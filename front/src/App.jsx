import React, { Component } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import './App.css';

import Token from './token/Token.jsx';
import Settings from './settings/Settings.jsx';
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
        <Settings
          token={this.state.token}
          onSaved={() => this.showMessage('Настройки сохранены', 'success')}
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
                onAuthorized={token => {
                  this.saveToken(token);
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
