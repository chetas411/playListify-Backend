require('dotenv').config();
const querystring = require("querystring");

const client_id = process.env.CLIENT_ID;
const redirect_uri = process.env.REDIRECT_URI;
const base_url_auth = "https://accounts.spotify.com";
const scope = 'user-read-private user-read-email user-top-read user-read-recently-played playlist-modify-public playlist-modify-private';

console.log(`${base_url_auth}/authorize?` +
    querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        show_dialog: true
    }));