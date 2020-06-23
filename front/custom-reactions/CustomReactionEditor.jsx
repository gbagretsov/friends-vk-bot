import React, {Component} from 'react';
import PropTypes from 'prop-types';

import './CustomReactionEditor.scss';

import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import DialogContent from '@material-ui/core/DialogContent';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Typography from '@material-ui/core/Typography';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import AddIcon from '@material-ui/icons/Add';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import InputAdornment from '@material-ui/core/InputAdornment';

class CustomReactionEditor extends Component{

  constructor(props) {
    super(props);
    const reaction = props.reaction;
    this.state = {
      loading: true,
      id: reaction && reaction.id,
      name: reaction && reaction.name || 'Моя реакция',
      probability: reaction && reaction.probability || 25,
      phrases: [],
      stickers: [],
      responses: [],
    };
  }

  componentDidMount = async () => {
    if (!this.state.id) {
      this.setState({
        loading: false,
      });
      return;
    }

    const url = `api/customReactions/${this.state.id}?token=${this.props.token}`;

    const params = {
      headers: {
        'Accept': 'application/json',
      },
      method: 'GET',
    };

    try {
      const response = await fetch(url, params);
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      } else {
        this.setState({
          phrases: data.phrases,
          stickers: data.stickers,
          responses: data.responses,
        });
      }
    } catch (error) {
      this.props.onError('Произошла ошибка, попробуйте позднее');
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const { id, name, probability, phrases, stickers, responses, loading } = this.state;
    return (
      <Dialog open scroll={'paper'} fullWidth={true} maxWidth={'sm'}>
        <DialogTitle id="simple-dialog-title">
          {id && 'Редактирование реакции'}
          {!id && 'Новая реакция'}
        </DialogTitle>
        <DialogContent>
          <TextField
            id="reaction-name"
            label="Название"
            value={name}
            disabled={loading}
            fullWidth={true}
            margin={'dense'}
            onChange={event => this.setState({name: event.target.value})}
          />
          <TextField
            id="reaction-probability"
            label="Вероятность срабатывания, %"
            value={probability}
            type={'number'}
            disabled={loading}
            fullWidth={true}
            margin={'dense'}
            onChange={event => this.setState({probability: event.target.value})}
          />
          <Typography variant={'h6'} style={{'marginTop': '2em'}}>Фразы, на которые реагирует бот</Typography>
          <Button variant={'text'} color={'primary'} onClick={() => this.addPhrase()}><AddIcon fontSize='small'/>Новая фраза</Button>
          <List dense={true} disablePadding={true}>
            { phrases.map((phrase, index) => {
              if (phrase.deleted) {
                return null;
              }
              return (
                <ListItem key={index} dense={true} disableGutters={true}>
                  <TextField
                    id={`reaction-phrase-${index}`}
                    value={phrase.text}
                    disabled={loading}
                    fullWidth={true}
                    margin={'none'}
                    onChange={event => this.setPhrase(index, event.target.value)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">
                        <IconButton className="button" onClick={ () => this.deletePhrase(index) }><DeleteIcon fontSize="small"/></IconButton>
                      </InputAdornment>
                    }}
                  />
                </ListItem>
              );
            })}
          </List>
          <Typography variant={'h6'} style={{'marginTop': '2em'}}>Стикеры, на которые реагирует бот</Typography>
          <Button variant={'text'} color={'primary'} onClick={() => this.addSticker()}><AddIcon fontSize='small'/>Новый стикер</Button>
          { stickers.map((sticker, index) => {
            if (sticker.deleted) {
              return null;
            }
            return (
              <TextField
                key={index}
                id={`reaction-sticker-${index}`}
                value={sticker.stickerId}
                disabled={loading}
                fullWidth={false}
                margin={'none'}
                style={{'marginLeft': index === 0 ? '0' : '1em'}}
                type={'number'}
                onChange={event => this.setSticker(index, event.target.value)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">
                    <IconButton className="button" onClick={ () => this.deleteSticker(index) }><DeleteIcon fontSize="small"/></IconButton>
                  </InputAdornment>
                }}
              />
            );
          })}
          <Typography variant={'h6'} style={{'marginTop': '2em'}}>Возможные ответы бота</Typography>
          <Button variant={'text'} color={'primary'} onClick={() => this.addResponse()}><AddIcon fontSize='small'/>Новый ответ</Button>
          <List dense={true} disablePadding={true}>
            { responses.map((response, index) => {
              if (response.deleted) {
                return null;
              }
              return (
                <ListItem key={index} dense={true} disableGutters={true}>
                  <TextField
                    id={`reaction-response-${index}-type`}
                    value={response.type}
                    label='Тип ответа'
                    disabled={loading}
                    fullWidth={false}
                    margin={'none'}
                    onChange={event => this.setResponseType(index, event.target.value)}
                  />
                  <TextField
                    id={`reaction-response-${index}-content`}
                    value={response.content}
                    label={this.getResponseContentLabelByType(response.type)}
                    disabled={loading}
                    fullWidth={true}
                    margin={'none'}
                    style={{'marginLeft': '1em'}}
                    onChange={event => this.setResponseContent(index, event.target.value)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">
                        <IconButton className="button" onClick={ () => this.deleteResponse(index) }><DeleteIcon fontSize="small"/></IconButton>
                      </InputAdornment>
                    }}
                  />
                </ListItem>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => this.props.onCancel()} color="primary">
            Отменить
          </Button>
          <Button onClick={() => this.saveReaction()} color="primary">
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  saveReaction = async () => {
    let url = 'api/customReactions';
    if (this.state.id) {
      url += `/${this.state.id}`;
    }

    let options = {
      token: this.props.token,
      reaction: {
        name: this.state.name,
        probability: this.state.probability,
        phrases: this.state.phrases,
        stickers: this.state.stickers,
        responses: this.state.responses,
      },
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
        this.props.onSaved({ id: this.state.id || data.id, name: this.state.name, probability: this.state.probability });
      }
    } catch (error) {
      this.props.onError('Произошла ошибка, попробуйте позднее');
    }
  }

  setPhrase = (index, value) => {
    const phrases = this.state.phrases;
    phrases[index].text = value;
    this.setState({ phrases });
  }

  setSticker = (index, value) => {
    const stickers = this.state.stickers;
    stickers[index].stickerId = value;
    this.setState({ stickers });
  }

  setResponseType = (index, value) => {
    const responses = this.state.responses;
    responses[index].type = parseInt(value, 10);
    if (isNaN(responses[index].type)) {
      responses[index].type = null;
    }
    this.setState({ responses });
  }

  setResponseContent = (index, value) => {
    const responses = this.state.responses;
    responses[index].content = value;
    this.setState({ responses });
  }

  getResponseContentLabelByType = (type) => {
    if (type === 1) {
      return 'Фраза';
    }
    if (type === 2) {
      return 'Ссылка на картинку JPG';
    }
    if (type === 3) {
      return 'ID ролика на YouTube';
    }
    if (type === 4) {
      return 'ID стикера';
    }
    return 'Содержимое ответа';
  }

  addPhrase = () => {
    const phrases = this.state.phrases;
    phrases.push({
      text: ''
    });
    this.setState({ phrases });
  }

  addSticker = () => {
    const stickers = this.state.stickers;
    stickers.push({
      stickerId: 1,
    });
    this.setState({ stickers });
  }

  addResponse = () => {
    const responses = this.state.responses;
    responses.push({
      type: 1,
      content: ''
    });
    this.setState({ responses });
  }

  deletePhrase = (index) => {
    const phrases = this.state.phrases;
    const phraseToDelete = phrases[index];
    if (phraseToDelete.id) {
      phraseToDelete.deleted = true;
    } else {
      phrases.splice(index, 1);
    }
    this.setState({ phrases });
  }

  deleteSticker = (index) => {
    const stickers = this.state.stickers;
    const stickerToDelete = stickers[index];
    if (stickerToDelete.id) {
      stickerToDelete.deleted = true;
    } else {
      stickers.splice(index, 1);
    }
    this.setState({ stickers });
  }


  deleteResponse = (index) => {
    const responses = this.state.responses;
    const responseToDelete = responses[index];
    if (responseToDelete.id) {
      responseToDelete.deleted = true;
    } else {
      responses.splice(index, 1);
    }
    this.setState({ responses });
  }
}

CustomReactionEditor.propTypes = {
  token: PropTypes.string.isRequired,
  reaction: PropTypes.any,
  onCancel: PropTypes.func.isRequired,
  onSaved: PropTypes.func.isRequired,
  onError: PropTypes.func,
};

export default CustomReactionEditor;
