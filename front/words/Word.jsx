import React, { Component } from 'react';
import ReactDOM from 'react-dom'
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';

class Word extends Component{

  constructor(props) {
    super(props);
    this.state = { editMode: false };
  }

  enterEditMode = () => {
    let width = ReactDOM.findDOMNode(this.refs.wordNameSpan).getBoundingClientRect().width;
    this.setState({
      editMode: true,
      editModeValue: this.props.name,
      inputWidth: width,
    });
  }

  saveWord = () => {
    let id = this.props.id;
    let oldName = this.props.name;
    let newName = this.state.editModeValue;

    let url = `api/words/${id}`;

    let options = {
      token: this.props.token,
      name: newName,
    }

    let params = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(options),
    }

    fetch(url, params)
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        throw new Error(data.error);
      } else {
        this.leaveEditMode();
        this.props.onChanged({ id, oldName, newName });
      }
    })
    .catch(error => {      
      this.props.onError('Произошла ошибка, попробуйте позднее');
    });
  }

  leaveEditMode = () => {
    this.setState({ editMode: false });
  }

  deleteWord = () => {
    let id = this.props.id;
    // TODO: delete word
    console.log(`delete word ${id}`);
  }

  handleChange = (event) => {
    this.setState({
      editModeValue: event.target.value,
    });
  }

  _handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      this.saveWord();
    }
  }

  renderGeneralMode = () => {
    let name = this.props.name;
    return (
      <div>
        <span className="word-name" ref="wordNameSpan">{ name }</span>
        <IconButton className="button" onClick={ () => this.enterEditMode() }><EditIcon fontSize="small"/></IconButton>
        <IconButton className="button" onClick={ () => this.deleteWord() }><DeleteIcon fontSize="small"/></IconButton>
      </div>
    );
  }

  renderEditMode = () => {
    let name = this.state.editModeValue;
    let width = this.state.inputWidth;
    let style = { width };
    return (
      <div>
        <TextField
          autoFocus={true}
          value={name}
          style={style}
          onChange={this.handleChange}
          onKeyPress={this._handleKeyPress}
        />
        <IconButton className="button" onClick={ () => this.saveWord() }><CheckIcon fontSize="small"/></IconButton>
        <IconButton className="button" onClick={ () => this.leaveEditMode() }><CloseIcon fontSize="small"/></IconButton>
      </div>
    );
  }

  render(){
    let editMode = this.state.editMode;

    return(
      <li>
        { !editMode && this.renderGeneralMode() }
        {  editMode && this.renderEditMode() }
      </li>
    );
  }

}

export default Word;