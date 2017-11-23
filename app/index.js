require('dotenv').config();
const WebClient = require('@slack/client').WebClient;
const moment = require('moment');
const token = process.env.SLACK_APP_TOKEN || '';
const clientId = process.env.SLACK_CLIENT_ID || '';
const clientSecret = process.env.SLACK_CLIENT_SECRET || '';
const express = require('express');
const app = express();

const scope = 'files:read,files:write:user';
const state = 'ghjgj657JHK97HI';
const redirectUri = 'http://localhost:3000/getToken';

app.get('/', function (req, res) {
    res.send();
});

app.get('/getToken', function (req, res) {
    if (req.query.code && req.query.state === state) {
        const api = new WebClient();

        api.oauth.access(clientId, clientSecret, req.query.code, redirectUri, (err, res) => {
        });
    } else {
        res.redirect(`https://slack.com/oauth/authorize?client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}&state=${state}`);
    }
});

app.post('/delete-files', (req, res) => {
    res.send('cool');
});

app.get('/delete-files', function (req, res) {
    res.send('ok');
    // const web = new WebClient(token);

    // web.files.list({
    //     // ts_to: moment().subtract(1, 'months').format('X'),
    //     // ts_to: moment().subtract(20, 'seconds').format('X'),
    // }, (err, res) => {
    //     res.files.map((file) => {
    //         web.users.profile.get({ user: file.user }, (err, user) => {
    //             web.files.delete(file.id, (err, res) => {
    //                 console.log(`Fichier "${file.title}", déposé par ${user.profile.real_name}, a été supprimé.`);
    //             });
    //         });
    //     });
    // });
});

app.listen(3000);