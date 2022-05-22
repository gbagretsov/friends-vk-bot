import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import CircularProgress from '@material-ui/core/CircularProgress';
import PropTypes from 'prop-types';

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
  };

  componentDidMount = () => {
    let token = localStorage['t'];
    if (token) {
      this.setState(
        { token },
        () => this.tryAuthorize()
      );
    }
  };

  tryAuthorize = async () => {
    this.setState({
      pending: true,
      error: false,
    });

    let url = 'api/';
    let data = {
      token: this.state.token,
    };

    let params = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      method: 'POST',
    };

    try {
      let response = await fetch(url, params);
      let data = await response.json();
      if (data.success) {
        this.setState({ pending: false });
        localStorage['t'] = this.state.token;
        this.props.onAuthorized(this.state.token);
      } else {
        throw new Error('token');
      }
    } catch (error) {
      if (error.message === 'token') {
        this.setState({
          pending: false,
          error: 'Неправильный токен',
        });
      } else {
        this.props.onError('Произошла ошибка, попробуйте позднее');
        this.setState({
          pending: false,
        });
      }
    }
  };

  _handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      this.tryAuthorize();
    }
  };

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
          onKeyPress={this._handleKeyPress}
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

Token.propTypes = {
  onError: PropTypes.func,
  onAuthorized: PropTypes.func,
};

export default Token;
