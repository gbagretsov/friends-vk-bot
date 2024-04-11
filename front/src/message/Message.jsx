import React, { Component } from 'react';
import Snackbar from '@mui/material/Snackbar';
import SnackbarContent from '@mui/material/SnackbarContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import PropTypes from 'prop-types';

import './Message.css';

class Message extends Component{

  constructor(props) {
    super(props);
    this.state = {
      open: false,
      messageInfo: {},
    };
  }

  queue = [];

  componentDidUpdate(prevProps) {
    if (this.props.message && this.props.message !== prevProps.message) {
      this.addMessageToQueue(this.props.message);
    }
  }

  addMessageToQueue = message => {
    this.queue.push(message);

    if (this.state.open) {
      this.setState({ open: false });
    } else {
      this.processQueue();
    }
  };

  processQueue = () => {
    if (this.queue.length > 0) {
      this.setState({
        messageInfo: this.queue.shift(),
        open: true,
      });
    }
  };

  handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    this.setState({ open: false });
  };

  handleExited = () => {
    this.processQueue();
  };

  render() {
    const { text, variant, key } = this.state.messageInfo;
    return (
      <div>
        <Snackbar
          key={key}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          open={this.state.open}
          autoHideDuration={6000}
          onClose={this.handleClose}
          onExited={this.handleExited}
        >
          <SnackbarContent
            className={'message ' + variant}
            message={text}
            action={[
              <IconButton
                key="close"
                aria-label="Close"
                color="inherit"
                onClick={this.handleClose}
              >
                <CloseIcon />
              </IconButton>,
            ]}
          />
        </Snackbar>
      </div>
    );
  }

}

Message.propTypes = {
  message: PropTypes.object,
};

export default Message;