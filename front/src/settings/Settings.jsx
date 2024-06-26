import React, { Component } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import PropTypes from 'prop-types';

import './Settings.css';

class Settings extends Component{

  constructor(props) {
    super(props);
    this.state = {
      ads: '',
      absentHolidaysPhrases: '',
      memesRecognitionConfidence: '',
      pending: false,
    };
  }

  handleAdsChange = (event) => {
    this.setState({
      ads: event.target.value,
    });
  };

  handleAbsentHolidaysPhrasesChange = (event) => {
    this.setState({
      absentHolidaysPhrases: event.target.value,
    });
  };

  handleMemesRecognitionConfidenceChange = (event) => {
    this.setState({
      memesRecognitionConfidence: event.target.value,
    });
  };

  componentDidMount = async () => {
    this.setState({ pending: true });

    let url = `api/settings?token=${this.props.token}`;

    let params = {
      headers: {
        'Accept': 'application/json',
      },
      method: 'GET',
    };

    try {
      let response = await fetch(url, params);
      let data = await response.json();
      if (this.isResponseValid(data)) {
        this.setState({ ...data });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      this.props.onError('Произошла ошибка, попробуйте позднее');
    } finally {
      this.setState({ pending: false });
    }

  };

  isResponseValid(data) {
    return data.ads !== null && data.ads !== undefined &&
      data.absentHolidaysPhrases !== null && data.absentHolidaysPhrases !== undefined &&
      data.memesRecognitionConfidence !== null && data.memesRecognitionConfidence !== undefined;
  }

  trySaveSettings = async () => {
    this.setState({
      pending: true,
    });

    let url = 'api/settings';
    let data = {
      token: this.props.token,
      ads: this.state.ads,
      absentHolidaysPhrases: this.state.absentHolidaysPhrases,
      memesRecognitionConfidence: this.state.memesRecognitionConfidence,
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
        this.props.onSaved();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      this.props.onError('Произошла ошибка, попробуйте позднее');
    } finally {
      this.setState({ pending: false });
    }
  };

  render(){
    let { ads, absentHolidaysPhrases, memesRecognitionConfidence, pending } = this.state;
    return(
      <div className="settings-wrapper">
        <Paper className="paper">
          <TextField
            id="ads"
            label="Реклама"
            className="setting-field"
            onChange={this.handleAdsChange}
            value={ads}
            disabled={pending}
            multiline={true}
            fullWidth={true}
          />
          <TextField
            id="absent-holidays-phrases"
            label="Варианты сообщений при отсутствии праздников"
            className="setting-field"
            onChange={this.handleAbsentHolidaysPhrasesChange}
            value={absentHolidaysPhrases}
            disabled={pending}
            multiline={true}
            fullWidth={true}
          />
          <TextField
            id="memes-confidence"
            label="Порог уверенности распознавания мемов (0 - любые картинки, >100 - фича отключена)"
            className="setting-field"
            onChange={this.handleMemesRecognitionConfidenceChange}
            value={memesRecognitionConfidence}
            disabled={pending}
            type="number"
            fullWidth={true}
          />
          <div className="save-button-wrapper">
            <Button variant="contained" color="primary" onClick={this.trySaveSettings} disabled={pending}>
              Сохранить
              { pending && <CircularProgress size={24} className="progress"/>}
            </Button>
          </div>
        </Paper>
      </div>
    );
  }

}

Settings.propTypes = {
  token: PropTypes.string.isRequired,
  onSaved: PropTypes.func,
  onError: PropTypes.func,
};

export default Settings;
