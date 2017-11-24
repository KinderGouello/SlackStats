require('dotenv').config();
const WebClient = require('@slack/client').WebClient;
const util = require('util');
const fs = require('fs');
const moment = require('moment');
const port = process.env.PORT || 3000;
const token = process.env.SLACK_APP_TOKEN || '';
const clientId = process.env.SLACK_CLIENT_ID || '';
const clientSecret = process.env.SLACK_CLIENT_SECRET || '';
const redis = require('redis');
const Promise = require('bluebird');

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

const scope = 'files:read,files:write:user,users:read';
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
  const userId = req.body.user_id;
  console.log('user_id', userId);
  redisClient.get(userId, (err, reply) => {
    if (err) throw err;

    console.log('reply', reply);

    if (!reply) {
      res.send('Tu n’as pas activé le cleaner, click là : https://slackstatslv.herokuapp.com/activate');
    } else {
      console.log('Listing des fichiers');
      const web = new WebClient(JSON.parse(reply).token);

      web.users.info(userId, (err, response) => {
        if (err) {
          console.log('Error getting user info', err);
          res.send(err);
        }
        const userIsAdmin = response.user.is_admin;
        const listOptions = userIsAdmin 
        ? {/* ts_to: moment().subtract(1, 'months').format('X') */}
        : {user: userId, /* ts_to: moment().subtract(1, 'months').format('X') */};
        console.log('List options:', listOptions);

        web.files.list(listOptions, (err, filesResponse) => {
          if (!filesResponse.files.length) {
            res.send('Aucun fichier à supprimer');
          } else {
            const promises = filesResponse.files.map(file => 
              new Promise((resolve, reject) => {
                web.users.profile.get({ user: file.user }, (err, userProfile) => {
                  if (err) reject(err);
                  
                  web.files.delete(file.id, (err, fileResponse) => {
                    if (err) reject(err);

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
            })
            .catch(err => {
              res.send('Oops. Something went wrong');
            });
          }
        });
      });
    }
  });
});

app.get('/listKeys', (req, res) => {
  redisClient.keys('*', (err, reply) => {
    if (err) {
      res.send('Error getting keys:', err);
    }
    if (!keys) {
      res.send('No keys');
    }
    res.send('Keys:', reply);
  });
}); 

app.listen(port);
