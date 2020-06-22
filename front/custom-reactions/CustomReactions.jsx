import React, {Component} from 'react';
import PropTypes from 'prop-types';

import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import TableBody from '@material-ui/core/TableBody';
import IconButton from '@material-ui/core/IconButton';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import CircularProgress from '@material-ui/core/CircularProgress';

import './CustomReactions.scss';

class CustomReactions extends Component{

  constructor(props) {
    super(props);
    this.state = {
      reactions: [],
      loading: true,
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
    const { reactions, loading } = this.state;
    return (
      <div>
        <Paper className="paper">
          <Typography variant="h5" gutterBottom>Пользовательские реакции</Typography>
          <Table className="custom-reactions-table" style={{width: 'auto'}}>
            <TableHead>
              <TableRow>
                <TableCell width="400px">Название</TableCell>
                <TableCell width="180px">Вероятность срабатывания, %</TableCell>
                <TableCell/>
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
        </Paper>
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
          <IconButton className="button" onClick={ () => this.deleteReaction(reaction) }><DeleteIcon fontSize="small"/></IconButton>
        </TableCell>
      </TableRow>
    );
  }

  editReaction = (reaction) => {
    console.log('enterEditMode for reaction ' + reaction.name);
  }

  deleteReaction = (reaction) => {
    console.log('deleting reaction ' + reaction.name);
  }
}

CustomReactions.propTypes = {
  token: PropTypes.string.isRequired,
  onError: PropTypes.func,
};

export default CustomReactions;
