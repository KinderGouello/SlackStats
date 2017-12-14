require('dotenv').config();
const WebClient = require('@slack/client').WebClient;
const RtmClient = require('@slack/client').RtmClient;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;
const RTM_MESSAGE_SUBTYPES = require('@slack/client').RTM_MESSAGE_SUBTYPES;
const util = require('util');
const fs = require('fs');
const moment = require('moment');
const port = process.env.PORT || 3000;
const token = process.env.SLACK_APP_TOKEN || '';
const clientId = process.env.SLACK_CLIENT_ID || '';
const clientSecret = process.env.SLACK_CLIENT_SECRET || '';
const redis = require('redis');
const redisClient = redis.createClient({
  'port': process.env.REDIS_PORT || '',
  'host': process.env.REDIS_HOST || '',
  'password': process.env.REDIS_PASSWORD || '',
});
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const scope = 'files:read,files:write:user,users.profile:read';
const state = 'ghjgj657JHK97HI';
const redirectUri = 'https://slackstatslv.herokuapp.com/getToken';

app.get('/', function (req, res) {
  res.send();
});

app.get('/getToken', function (req, res) {
  if (req.query.code && req.query.state === state) {
    const api = new WebClient();

    api.oauth.access(clientId, clientSecret, req.query.code, redirectUri, (err, authResponse) => {
      console.log('user_id', authResponse.user_id);
      console.log('token', authResponse.access_token);
      console.log('save', JSON.stringify({
        'token': authResponse.access_token,
      }));

      redisClient.set(authResponse.user_id, JSON.stringify({
        'token': authResponse.access_token,
      }), (err, reply) => {
        if (err) throw err;

        console.log('reply save', reply);

        res.send('Ok merci, c’est super cool ! Tu peux maintenant lancer ta commande sur Slack et nettoyer tous tes fichiers');
      });
    });
  } else {
    res.send('Error during logging');
  }
});

app.get('/activate', (req, res) => {
  res.redirect(`https://slack.com/oauth/authorize?client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}&state=${state}`);
});

app.post('/delete-files', (req, res) => {
  console.log('user_id', req.body.user_id);
  redisClient.get(req.body.user_id, (err, reply) => {
    if (err) throw err;

    console.log('reply', reply);

    if (!reply) {
      res.send('Tu n’as pas activé le cleaner, click là : https://slackstatslv.herokuapp.com/activate');
  } else {
      console.log('Listing des fichiers');
      const web = new WebClient(JSON.parse(reply).token);

      web.files.list({
        // ts_to: moment().subtract(1, 'months').format('X'),
        // ts_to: moment().subtract(20, 'seconds').format('X'),
      }, (err, filesResponse) => {
        if (!filesResponse.files.length) {
          res.send('Aucun fichier à supprimer');
        }

        const promises = filesResponse.files.map(file => 
          new Promise(resolve => {
            web.users.profile.get({ user: file.user }, (err, userProfile) => {
              if (err) throw err;

              web.files.delete(file.id, (err, fileResponse) => {
                console.log(err);
                console.log(fileResponse);

                if (err) throw reject(err);

                if (filesResponse.ok) {
                  resolve(`Fichier "${file.title}", déposé par ${userProfile.profile.real_name}, a été supprimé.`);
                } else {
                  resolve(`Le fichier "${file.title}", déposé par ${userProfile.profile.real_name}, n’a pas pu être supprimé.`);
                }
              });
            });
          })
        );

        Promise.all(promises)
        .then(responses => {
          res.send(responses.reduce((accumulator, line) =>
            accumulator + `${line}\n`
          , ''));
        });
      });
    }
  });
});

const rtm = new RtmClient(process.env.SLACK_BOT_TOKEN || '');
rtm.start();

// {
//     message: {
//         text:
//         user:
//         timestamp:
//         channel:
//         nb_responses:
//         nb_reactions:
//     },
//     score: 40
// }
// enlever le plus bas et inserer le nouveau si score > au plus bas

const api = new WebClient(process.env.SLACK_APP_TOKEN);

const calculScore = (replyCount, reactionCount, timestamp = 0) => {
    const REPLY_MULTIPLIER = 0.5;
    const REACTION_MULTIPLIER = 1;

    return replyCount * REPLY_MULTIPLIER + reactionCount * REACTION_MULTIPLIER;
}

const getMessage = (channel, timestamp) => {
    api.channels.history(channel, {
      count: 1,
      inclusive: true,
      latest: timestamp,
      oldest: timestamp
    }, (err, response) => {
      if (response.messages.length < 0) {
        return null;
      }

      const replyCount = response.messages[0].reply_count || 0;
      const reactionCount = response.messages[0].reactions.reduce((prev, current) => prev + current.count, 0) || 0;

      const message = {
          message: {
              text: response.messages[0].text,
              user: response.messages[0].user,
              timestamp: response.messages[0].ts,
              channel: channel,
              nb_responses: replyCount,
              nb_reactions: reactionCount,
          },
          score: calculScore(replyCount, reactionCount)
      };

      console.log(message);
    });
}

rtm
.on(`${RTM_EVENTS.MESSAGE}::${RTM_MESSAGE_SUBTYPES.MESSAGE_CHANGED}`, (message) => {
  console.log('changed : ', message);
})
.on(`${RTM_EVENTS.MESSAGE}::${RTM_MESSAGE_SUBTYPES.MESSAGE_DELETED}`, (message) => {
  console.log('deleted : ', message);
})
.on(`${RTM_EVENTS.MESSAGE}::message_replied`, (message) => {
  getMessage(message.channel, message.message.ts);
})
.on(RTM_EVENTS.REACTION_ADDED, (reaction) => {
  getMessage(reaction.item.channel, reaction.item.ts);
})
.on(RTM_EVENTS.REACTION_REMOVED, (reaction) => {
  getMessage(reaction.item.channel, reaction.item.ts);
});

app.listen(port);
