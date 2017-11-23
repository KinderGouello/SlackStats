require('dotenv').config();
const WebClient = require('@slack/client').WebClient;
// const token = process.env.SLACK_API_TOKEN || '';
const clientId = process.env.SLACK_CLIENT_ID || '';
const clientSecret = process.env.SLACK_CLIENT_SECRET || '';
const express = require('express');
const app = express();

const scope = 'files:read,files:write:user';
const state = 'ghjgj657JHK97HI';
const redirectUri = 'http://localhost:3000/getToken';

const web = new WebClient();

app.get('/getToken', function (req, res) {
    if (req.query.code && req.query.state === state) {
        web.oauth.access(clientId, clientSecret, req.query.code, redirectUri, (err, res) => {
            console.log(res.access_token);
        });
    } else {
        res.redirect(`https://slack.com/oauth/authorize?client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}&state=${state}`);
    }
});

// const web = new WebClient(token);
// web.files.list((err, res) => {
//     res.files.map((file) => {
//         web.files.delete(file.id, (err, res) => {
//             console.log(res);
//         });
//     });
//     // console.log('Response', res);
// });
// web.chat.postMessage('C1232456', 'Hello there', function(err, res) {
//   if (err) {
//     console.log('Error:', err);
//   } else {
//     console.log('Message sent: ', res);
//   }
// });

app.listen(3000);