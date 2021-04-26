require('dotenv').config();
const express = require("express");
const querystring = require("querystring");
const url = require("url");
const axios = require("axios");
const cors = require("cors");
const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());

app.use(express.urlencoded({
    extended: false
}));
app.use(express.json());

//app credentials provided by spotify
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;

// base url for authorization
const base_url_auth = "https://accounts.spotify.com";

// scope for which the access would be provided
const scope = 'user-read-private user-read-email user-top-read user-read-recently-played';

//variable to store token
let current_token;

app.get("/",(req,res)=>{
    console.log(`${base_url_auth}/authorize?` +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            show_dialog: true
        }));
   res.send("You are viewing localhost: 5000")
});

// this will authorise the user and will get code back as query parameter
app.get("/login",(req,res)=>{
    res.redirect(`${base_url_auth}/authorize?` +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            show_dialog: true
        })
    );    
})

// here we extract the code returned as a query parameter in the url and will make a post request
// with the provided code to get access_token that will be used to make api requests to spotify
app.get("/token",(req,res)=>{
    const code = req.query.code;
    if(code){
        const params = new URLSearchParams({
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "client_id": client_id,
            "client_secret": client_secret
        })
        const config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        axios.post(`${base_url_auth}/api/token`,params,config)
        .then((body)=>{
            console.log(body.data);
            const access_token = body.data.access_token;
            current_token = access_token;
            res.json({token: current_token});
        })
        .catch((err)=>{
            console.log("error");
        })
    }else{
        console.log("Error: code not recieved");
    }
});


//api call to get top tracks
app.get("/tracks",(req,res)=>{
    if(current_token){
        const options = {
            method: "GET",
            headers: { 'Authorization': 'Bearer ' + current_token },
            url: 'https://api.spotify.com/v1/me/top/tracks',
            params: {
                limit: 50
            }
        }
        axios(options).then((response) => {
            const data = response.data.items;
            const info = data.map((item) => {
            const trackdata = {
                imgUrl: item.album.images[1],
                information: item.artists.map((artist) => {
                    return artist.name;
                }),
                name: item.name,
                preview_url: item.preview_url
            };
            return trackdata;
            });
            res.json(info);
        })
        .catch((err) => {
            console.log(err);
        })
    }else{
        console.log("Error: token not generated");
    }

});

//api to get top artists
app.get("/artists", (req, res) => {
    if (current_token) {
        const options = {
            method: "GET",
            headers: { 'Authorization': 'Bearer ' + current_token },
            url: 'https://api.spotify.com/v1/me/top/artists',
            params: {
                limit: 50,
            }
        }
        axios(options).then((response) => {
            const data = response.data.items;
            const info = data.map((item) => {
                const artistdata = {
                    imgUrl: item.images[1],
                    information: item.genres,
                    name: item.name,
                };
                return artistdata;
            });
            res.json(info);
        })
        .catch((err) => {
            console.log(err);
        })
    } else {
        console.log("Error: token not generated");
    }

});

//api to get list of recently played tracks
app.get("/history",(req,res)=>{
    if (current_token) {
        const options = {
            method: "GET",
            headers: { 'Authorization': 'Bearer ' + current_token },
            url: 'https://api.spotify.com/v1/me/player/recently-played',
            params: {
                limit: 50,
            }
        }
        axios(options).then((response) => {
            const data = response.data.items;
            const info = data.map((item) => {
                const trackdata = {
                    imgUrl: item.track.album.images[1],
                    information: item.track.artists.map((artist)=>{
                        return artist.name;
                    }),
                    name: item.track.name,
                    preview_url: item.track.preview_url,
                    played_at: item.played_at
                };
                return trackdata;
            });
            res.json(info);
        })
            .catch((err) => {
                console.log(err);
            })
    } else {
        console.log("Error: token not generated");
    }

})



app.listen(PORT,()=>console.log("Server is running..."));