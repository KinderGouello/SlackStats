require('dotenv').config();
const WebClient = require('@slack/client').WebClient;
const fs = require('fs');
const moment = require('moment');
const port = process.env.PORT || 3000;
const token = process.env.SLACK_APP_TOKEN || '';
const clientId = process.env.SLACK_CLIENT_ID || '';
const clientSecret = process.env.SLACK_CLIENT_SECRET || '';
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({
    extended: true,
}));
app.use(bodyParser.json());

const scope = 'files:read,files:write:user';
const state = 'ghjgj657JHK97HI';
const redirectUri = 'http://localhost:3000/getToken';
const db = 'db.json';

app.get('/', function (req, res) {
    res.send();
});

app.get('/getToken', function (req, res) {
    if (req.query.code && req.query.state === state) {
        const api = new WebClient();

        api.oauth.access(clientId, clientSecret, req.query.code, redirectUri, (err, authResponse) => {
            const users = JSON.parse(fs.readFileSync('db.json'));
            users.push({
                'user_id': authResponse.user_id,
                'token': authResponse.access_token,
            });
            fs.writeFileSync(db, JSON.stringify(users));

            res.send('Ok merci, c’est super cool ! Tu peux maintenant lancer ta commande sur Slack et nettoyer tous tes fichiers');
        });
    } else {
        res.send('Error during logging');
    }
});

app.get('/activate', (req, res) => {
    res.redirect(`https://slack.com/oauth/authorize?client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}&state=${state}`);
});

app.post('/delete-files', (req, res) => {
    const users = JSON.parse(fs.readFileSync(db));
    const user = users.find((user) => {
        return user.user_id === req.body.user_id;
    });

    if (!user) {
        res.send('Tu n’as pas activer le cleaner, click là : https://slackstatslv.herokuapp.com/activate');
    } else {
        console.log('Listing des fichiers');
        const web = new WebClient(user.token);

        web.files.list({
            // ts_to: moment().subtract(1, 'months').format('X'),
            // ts_to: moment().subtract(20, 'seconds').format('X'),
        }, (err, res) => {
            if (!res.files.length) {
                res.send('Aucun fichier à supprimer');
            }

            res.files.reduce((accumulator, file) => {
                return web.users.profile.get({ user: file.user }, (err, userProfile) => {
                    return web.files.delete(file.id, (err, res) => {
                        return accumulator += `Fichier "${file.title}", déposé par ${userProfile.profile.real_name}, a été supprimé.\n`;
                    });
                });
            }, '');

            console.log(response);
        });
    }
});

app.listen(port);