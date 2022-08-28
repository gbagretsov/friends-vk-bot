import React, {Component} from 'react';
import PropTypes from 'prop-types';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';

import './CustomReactions.scss';
import CustomReactionEditor from './CustomReactionEditor';

class CustomReactions extends Component{

  constructor(props) {
    super(props);
    this.state = {
      reactions: [],
      loading: true,
      editing: false,
      editedReaction: null,
    };
  }

  componentDidMount = async () => {
    const url = `api/customReactions?token=${this.props.token}`;

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
        this.setState({ reactions: data });
      }
    } catch (error) {
      this.props.onError('Произошла ошибка, попробуйте позднее');
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const { reactions, loading, editing, editedReaction } = this.state;
    return (
      <div>
        <Paper className="paper">
          <Typography variant="h5" gutterBottom>Пользовательские реакции</Typography>
          <Button variant={'text'} color={'primary'} onClick={() => {
            this.setState({
              editing: true,
              editedReaction: null
            });
          }}><AddIcon fontSize='small'/>Новая реакция</Button>
          <div className="custom-reactions-table-wrapper">
            <Table className="custom-reactions-table" style={{width: 'auto'}}>
              <TableHead>
                <TableRow>
                  <TableCell className={'name-column'} width="400px">Название</TableCell>
                  <TableCell className={'probability-column'}>Вероятность</TableCell>
                  <TableCell className={'buttons-column'}/>
                </TableRow>
              </TableHead>
              <TableBody>
                { !loading && reactions.length > 0 && this.renderReactionsTableRows(reactions) }
                { !loading && reactions.length === 0 &&
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    Пользовательские реакции не заданы
                  </TableCell>
                </TableRow>
                }
                { loading &&
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <CircularProgress size={24} className="progress"/>
                  </TableCell>
                </TableRow>
                }
              </TableBody>
            </Table>
          </div>
        </Paper>
        { editing && <CustomReactionEditor
          token={this.props.token}
          reaction={editedReaction}
          onSaved={saved => this.handleOnSaved(saved)}
          onError={error => this.props.onError(error)}
          onCancel={() => this.setState({
            editedReaction: null,
            editing: false,
          })}/>
        }
      </div>
    );
  }

  renderReactionsTableRows = (reactions) => {
    return reactions.map(reaction =>
      <TableRow key={reaction.id}>
        <TableCell component="th" scope="row">
          {reaction.name}
        </TableCell>
        <TableCell>{reaction.probability}</TableCell>
        <TableCell align="center">
          <IconButton className="button" onClick={ () => this.editReaction(reaction) }><EditIcon fontSize="small"/></IconButton>
          <IconButton className="button" onClick={ () => this.showDeleteConfirmationDialog(reaction) }><DeleteIcon fontSize="small"/></IconButton>
        </TableCell>
      </TableRow>
    );
  }

  editReaction = (reaction) => {
    this.setState({
      editing: true,
      editedReaction: reaction,
    });
  }

  showDeleteConfirmationDialog = (reaction) => {
    const deleteConfirmed = confirm(`Подтвердите удаление реакции "${reaction.name}"`);
    if (deleteConfirmed) {
      this.deleteReaction(reaction);
    }
  }

  deleteReaction = async (reaction) => {
    const url = `api/customReactions/${reaction.id}?token=${this.props.token}`;

    const params = {
      headers: {
        'Accept': 'application/json',
      },
      method: 'DELETE',
    };

    try {
      const response = await fetch(url, params);
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      } else {
        const reactions = this.state.reactions.filter(r => r.id !== reaction.id);
        this.setState({ reactions });
        this.props.onReactionDeleted(reaction);
      }
    } catch (error) {
      this.props.onError('Произошла ошибка, попробуйте позднее');
    }
  }

  handleOnSaved = (savedReaction) => {
    const reactions = this.state.reactions;
    const existingReactionIndex = reactions.findIndex(reaction => reaction.id === savedReaction.id);
    if (existingReactionIndex > -1) {
      reactions[existingReactionIndex] = savedReaction;
    } else {
      reactions.push(savedReaction);
    }
    this.setState({
      reactions,
      editing: false,
      editedReaction: null,
    });
    this.props.onReactionSaved(savedReaction);
  }
}

CustomReactions.propTypes = {
  token: PropTypes.string.isRequired,
  onReactionSaved: PropTypes.func,
  onReactionDeleted: PropTypes.func,
  onError: PropTypes.func,
};

export default CustomReactions;
