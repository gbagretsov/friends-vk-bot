import React, { Component } from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import CircularProgress from '@material-ui/core/CircularProgress';
import Paper from '@material-ui/core/Paper';

import './Ads.scss';

class Ads extends Component{

  constructor(props) {
    super(props);
    this.state = {
      ads: '',
      pending: false,
    };
  }

  handleChange = (event) => {
    this.setState({
      ads: event.target.value,
    });
  }

  componentDidMount = () => {
    this.setState({ pending: true });

    let url = `api/ads?token=${this.props.token}`;

    let params = {
      headers: {
        'Accept': 'application/json',
      },
      method: 'GET',
    }

    fetch(url, params)
    .then(response => response.json())
    .then(data => {
      if (data.ads) {
        this.setState({ ads: data.ads });
      } else {
        throw new Error(data.error);
      }
    })
    .catch(error => {      
      this.props.onError('Произошла ошибка, попробуйте позднее');
    })
    .then(() => {
      this.setState({ pending: false });
    });
  }

  trySaveAds = () => {
    this.setState({
      pending: true,
    });

    let url = 'api/ads';
    let data = {
      token: this.props.token,
      ads: this.state.ads,
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
      if (data.success) {
        this.props.onSaved();
      } else {
        throw new Error(data.error);
      }
    })
    .catch(error => {
      this.props.onError('Произошла ошибка, попробуйте позднее');
    })
    .then(() => {  
      this.setState({ pending: false });
    });
  }

  render(){
    let { ads, pending } = this.state;
    return(
      <div className="ads-wrapper">
        <Paper className="paper">
          <TextField
            id="ads"
            label="Реклама"
            onChange={this.handleChange}
            value={ads}
            disabled={pending}
            multiline={true}
            fullWidth={true}
          />
          <div className="button-wrapper">
            <Button variant="contained" color="primary" onClick={this.trySaveAds} disabled={pending}>
              Сохранить
              { pending && <CircularProgress size={24} className="progress"/>}
            </Button>
          </div>
        </Paper>
      </div>
    );
  }

}

export default Ads;