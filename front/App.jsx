import React, { Component } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';

import Button from '@material-ui/core/Button';
import './App.scss';

class App extends Component{
  render(){
    return(
      <div className="App">
        <h1>Hello from bot!</h1>
        <p>TODO: страница администратора</p>
        <Button variant="contained" color="primary">Кнопка</Button>
      </div>
    );
  }
}

export default App;
