import React, { Component } from 'react';
import Message from './Message.js';
import socketIO from 'socket.io-client';

class App extends Component {
  constructor() {
    super();
    this.state = {
      endpoint: 'http://127.0.0.1:9000',
      messages: [],
    };
  }

  componentDidMount() {
    fetch(`${this.state.endpoint}/topMessages`)
    .then(results => {
      return results.json();
    })
    .then(data => {
      this.setState({ messages: data });
    })

    const socket = socketIO(this.state.endpoint);
    socket.on('rankingChanged', data => {
      this.setState({ messages: data });
    });
  }

  render() {
    const messages = this.state.messages.map(message => {
      return (
        <Message key={message.id} text={message.text} link={message.link} reactionCount={message.nb_reactions} threadCount={message.nb_responses} />
      );
    });

    return (
      <div className="message-container">
        {messages}
      </div>
    );
  }
}

export default App;
