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

app.get('/getToken', function (req, res) {
    if (res.params && res.params.code) {
        console.log('First step done');
    } else {
        res.redirect(`https://slack.com/oauth/authorize?client_id=${clientId}&scope=${scope}`);
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