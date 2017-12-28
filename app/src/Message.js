import React, { Component } from 'react';

class Message extends Component {
    render() {
        const {text, link, reactionCount, threadCount} = this.props;

        return (
            <a href={link}>
                <p className="message">
                  {text}
                </p>
                Réactions : {reactionCount}
                Réponses en thread : {threadCount}
            </a>
        );
    }
}

export default Message;