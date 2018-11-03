import React, { Component } from 'react';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import AddIcon from '@material-ui/icons/Add';
import PropTypes from 'prop-types';

import Word from './Word.jsx';

import './Words.scss';

class Words extends Component{

  constructor(props) {
    super(props);
    this.state = {
      words: [],
      newWordInputValue: '',
    };
    this.newWordInputRef = React.createRef();
  }

  componentDidMount = async () => {
    let url = `api/words?token=${this.props.token}`;

    let params = {
      headers: {
        'Accept': 'application/json',
      },
      method: 'GET',
    };

    try {
      let response = await fetch(url, params);
      let data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      } else {
        this.setState({ words: data });
      }
    } catch (error) {
      this.props.onError('Произошла ошибка, попробуйте позднее');
    }
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

  onWordDeleted = (deleted) => {
    this.setState(state => {
      let words = state.words;
      let index = words.findIndex(word => word.id === deleted.id);
      words.splice(index, 1);
      return { words };
    });
    this.props.onWordDeleted(deleted);
  }

  addWord = async () => {
    let name = this.newWordInputRef.current.value;
    // TODO: валидация

    let url = 'api/words';

    let options = {
      token: this.props.token,
      name,
    };

    let params = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(options),
    };

    try {
      let response = await fetch(url, params);
      let data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      } else {
        let word = data.word;
        this.setState(state => {
          let words = state.words;
          words.unshift(word);
          return { words };
        });
        this.newWordInputRef.current.value = '';
        this.props.onWordAdded(word);
      }
    } catch (error) {
      if (error.message === 'duplicate') {
        var errorMessage = `Слово "${name}" уже добавлено`;
      } else {
        errorMessage = 'Произошла ошибка, попробуйте позднее';
      }
      this.props.onError(errorMessage);
    } finally {
      this.setState({
        newWordInputValue: '',
      });
    }
  }

  handleNewWordChange = (event) => {
    this.setState({
      newWordInputValue: event.target.value,
    });
  }

  _handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      this.addWord();
    }
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
        onDeleted={this.onWordDeleted}
        onError={(error) => this.props.onError(error)}
      />
    );

    return(
      <div className="words-wrapper">
        <Paper className="paper">
          <Typography variant="h5" gutterBottom>Список слов</Typography>
          <ul>
            <li>
              <div>
                <input
                  className="new-word"
                  onKeyPress={this._handleKeyPress}
                  placeholder="Новое слово"
                  ref={this.newWordInputRef}
                />
                <IconButton className="button" onClick={ () => this.addWord() }><AddIcon fontSize="small"/></IconButton>
              </div>
            </li>
            { wordsElements }
          </ul>
        </Paper>
      </div>
    );
  }

}

Words.propTypes = {
  token: PropTypes.string.isRequired,
  onError: PropTypes.func,
  onWordAdded: PropTypes.func,
  onWordChanged: PropTypes.func,
  onWordDeleted: PropTypes.func,
};

export default Words;