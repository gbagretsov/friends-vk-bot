import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import CircularProgress from '@material-ui/core/CircularProgress';

import './Token.scss';

class Token extends Component{

  constructor(props) {
    super(props);
    this.state = {
      token: '',
      pending: false,
      error: false,
    };
  }

  handleChange = (event) => {
    this.setState({
      token: event.target.value,
      error: false,
    });
  }

  tryAuthorize = () => {
    this.setState({
      pending: true,
    });

    let url = 'api/';
    let data = {
      token: this.state.token,
    }

    let params = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      method: 'POST',
    }

    fetch(url, params)
    .then(response => response.json())
    .then(data => {
      let error = data.success ? false : 'Неправильный токен';      
      this.setState({ pending: false, error });

      if (!error) {
        this.props.onAuthorized(this.state.token);
      }
    })
    .catch(error => {
      // TODO: всплывающее сообщение об ошибке
      console.log(error);
      this.setState({ pending: false });
    });  
  }

  render(){
    let { token, pending, error } = this.state;
    return(
      <div className="token-wrapper">
        <TextField
          className="token-input"
          id="token"
          label="Токен"
          onChange={this.handleChange}
          value={token}
          disabled={pending}
          error={error.length > 0}
          helperText={error}
        />
        <div className="button-wrapper">
          <Button variant="contained" color="primary" onClick={this.tryAuthorize} disabled={pending}>
            Ввести токен
            { pending && <CircularProgress size={24} className="progress"/>}
          </Button>
        </div>
      </div>
    );
  }
}

export default Token;