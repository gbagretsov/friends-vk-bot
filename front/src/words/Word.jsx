import React, { Component } from 'react';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';
import ThumbUpIcon from '@material-ui/icons/ThumbUp';
import PropTypes from 'prop-types';

class Word extends Component{

  constructor(props) {
    super(props);
    this.state = { editMode: false };
    this.wordNameSpanRef = React.createRef();
  }

  enterEditMode = () => {
    let width = this.wordNameSpanRef.current.getBoundingClientRect().width;
    this.setState({
      editMode: true,
      editModeValue: this.props.name,
      inputWidth: width,
    });
  };

  shouldComponentUpdate = (nextProps, nextState) => {
    return (
      this.props.name !== nextProps.name || 
      this.props.isApproved !== nextProps.isApproved ||
      this.state.editMode !== nextState.editMode ||
      this.state.editModeValue !== nextState.editModeValue
    );
  };

  saveWord = async () => {
    let id = this.props.id;
    let oldName = this.props.name;
    let newName = this.state.editModeValue;

    let url = `api/words/${id}`;

    let options = {
      token: this.props.token,
      name: newName,
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
        this.leaveEditMode();
        this.props.onChanged({ id, oldName, newName });
      }
    } catch (error) {
      this.props.onError('Произошла ошибка, попробуйте позднее');
    }
  };

  leaveEditMode = () => {
    this.setState({ editMode: false });
  };

  deleteWord = async () => {
    let id = this.props.id;

    let url = `api/words/${id}`;

    let options = {
      token: this.props.token,
    };

    let params = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
      body: JSON.stringify(options),
    };

    try {
      let response = await fetch(url, params);
      let data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      } else {
        this.leaveEditMode();
        this.props.onDeleted({ id, name: this.props.name });
      }
    } catch (error) {
      this.props.onError('Произошла ошибка, попробуйте позднее');
    }
  };

  approveWord = async () => {
    let id = this.props.id;

    let url = `api/words/${id}/approve`;

    let options = {
      token: this.props.token,
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
        this.props.onApproved({ id, name: this.props.name });
      }
    } catch (error) {
      this.props.onError('Произошла ошибка, попробуйте позднее');
    }
  };


  handleChange = (event) => {
    this.setState({
      editModeValue: event.target.value,
    });
  };

  _handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      this.saveWord();
    }
  };

  renderGeneralMode = () => {
    let name = this.props.name;
    let isApproved = this.props.isApproved;
    return (
      <div>
        <span className="word-name" ref={this.wordNameSpanRef}>{ name }</span>
        <IconButton className="button" onClick={ () => this.enterEditMode() }><EditIcon fontSize="small"/></IconButton>
        <IconButton className="button" onClick={ () => this.deleteWord() }><DeleteIcon fontSize="small"/></IconButton>
        { !isApproved && <IconButton className="button" onClick={ () => this.approveWord() }><ThumbUpIcon fontSize="small"/></IconButton> }
      </div>
    );
  };

  renderEditMode = () => {
    let name = this.state.editModeValue;
    let width = this.state.inputWidth;
    let isApproved = this.props.isApproved;
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
        { !isApproved && <IconButton className="button" onClick={ () => this.approveWord() }><ThumbUpIcon fontSize="small"/></IconButton> }
      </div>
    );
  };

  render(){
    let editMode = this.state.editMode;
    let isApproved = this.props.isApproved;

    return(
      <li className={isApproved ? null : 'need-to-approve'}>
        { !editMode && this.renderGeneralMode() }
        {  editMode && this.renderEditMode() }
      </li>
    );
  }

}

Word.propTypes = {
  name: PropTypes.string.isRequired,
  id: PropTypes.number.isRequired,
  isApproved: PropTypes.bool.isRequired,
  token: PropTypes.string.isRequired,
  onError: PropTypes.func,
  onChanged: PropTypes.func,
  onDeleted: PropTypes.func,
  onApproved: PropTypes.func,
};

export default Word;
