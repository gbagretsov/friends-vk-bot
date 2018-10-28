import React, { Component } from 'react';
import ReactDOM from 'react-dom'
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

import Word from './Word.jsx';

import './Words.scss';

class Words extends Component{

  constructor(props) {
    super(props);
    this.state = {
      words: [],
    };
  }

  componentDidMount = () => {
    let url = `api/words?token=${this.props.token}`;

    let params = {
      headers: {
        'Accept': 'application/json',
      },
      method: 'GET',
    }

    fetch(url, params)
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        throw new Error(data.error);
      } else {
        this.setState({ words: data });
      }
    })
    .catch(error => {      
      this.props.onError('Произошла ошибка, попробуйте позднее');
    });
  }

  onWordChanged = (changed) => {
    this.setState(state => {
      let words = state.words;
      let index = words.findIndex(word => word.id === changed.id);
      words[index].name = changed.newName;
      return { words };
    });
    this.props.onWordChanged(changed);
  }

  render(){
    let { words } = this.state;
    let wordsElements = words.map(word =>
      <Word
        key={word.id}
        id={word.id}
        name={word.name}
        token={this.props.token}
        onChanged={this.onWordChanged}
        onError={(error) => this.props.onError(error)}
      />
    );

    return(
      <div className="words-wrapper">
        <Paper className="paper">
          <Typography variant="h5" gutterBottom>Список слов</Typography>
          <ul>
            { wordsElements }
          </ul>
        </Paper>
      </div>
    );
  }

}

export default Words;