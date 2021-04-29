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
const scope = 'user-read-private user-read-email user-top-read user-read-recently-played playlist-modify-public playlist-modify-private';

//variable to store token
let current_token;

app.get("/", (req, res) => {
    //This will print the url to which authorization is to be done.Using this in Client side
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



//THIS LOGIN PART IS BEING DONE IN CLIENT SIDE ONLY (just inluded here for reference)
// this will authorise the user and will get code back as query parameter
app.get("/login", (req, res) => {
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



// Here we extract the code returned as a query parameter in the url and will make a post request
// with the provided code to get access_token that will be used to make api requests to spotify
app.get("/token", (req, res) => {
    const code = req.query.code;
    if (code) {
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

        axios.post(`${base_url_auth}/api/token`, params, config)
            .then((body) => {
                console.log(body.data);
                const access_token = body.data.access_token;
                current_token = access_token;
                console.log("TOKEN SENT")
                res.json({ token: current_token });
            })
            .catch((err) => {
                console.log("ERROR: Token could not be generated");
            })
    } else {
        console.log("ERROR: Auth code not recieved");
    }
});



//api to get user profile
app.get("/user", (req, res) => {
    if (current_token) {
        const options = {
            method: "GET",
            headers: { 'Authorization': 'Bearer ' + current_token },
            url: 'https://api.spotify.com/v1/me',
        }
        axios(options).then((response) => {
            const data = response.data;
            const info = {
                display_name: data.display_name,
                id: data.id
            }
            console.log("PROFILE SENT");
            res.json(info);
        })
        .catch((err) => {
             console.log("ERROR: Profile could not be fetched")
        })
    } else {
        console.log("ERROR: Calling api before token generation");
    }
})



//api call to get top tracks
app.get("/tracks", (req, res) => {
    if (current_token) {
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
                    preview_url: item.preview_url,
                    uri: item.uri
                };
                return trackdata;
            });
            console.log("TRACKS SENT");
            res.json(info);
        })
        .catch((err) => {
            console.log("ERROR: Top Tracks could not be fetched");
        })
    } else {
        console.log("ERROR: Calling api before token generation");
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
                    id: item.id
                };
                return artistdata;
            });
            console.log("ARTISTS SENT");
            res.json(info);
        })
            .catch((err) => {
                console.log("ERROR: Top artists could not be fetched");
            })
    } else {
        console.log("ERROR: Calling api before token generation");
    }

});




//api to get list of recently played tracks
app.get("/history", (req, res) => {
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
                    information: item.track.artists.map((artist) => {
                        return artist.name;
                    }),
                    name: item.track.name,
                    preview_url: item.track.preview_url,
                    played_at: item.played_at,
                    uri: item.track.uri
                };
                return trackdata;
            });
            console.log("HISTORY SENT");
            res.json(info);
        })
            .catch((err) => {
                console.log("ERROR: History could not be fetched");
            })
    } else {
        console.log("ERROR: Calling api before token generation");
    }

});




//api to get playlist of top tracks by user's top artists
app.post("/createplaylist/:user_id/Top%20Artists", (req, res) => {
    if (current_token) {
        const user_id = req.params.user_id;
        const artistIDs = req.body.map((artist) => {
            return artist.id;
        });
        const optionsForPlaylistCreation = {
            method: "POST",
            headers: {
                'Authorization': 'Bearer ' + current_token,
                'Content-Type': 'application/json'
            },
            url: `https://api.spotify.com/v1/users/${user_id}/playlists`,
            data: {
                name: "Top Artists"
            }
        };
        axios(optionsForPlaylistCreation)
            .then((response) => {
                const data = response.data;
                const info = {
                    pl_id: data.id,
                    pl_url: data.external_urls.spotify
                }
                console.log("PLAYLIST CREATED");
                const requests = artistIDs.map((id) => {
                    const option = {
                        method: "GET",
                        headers: {
                            'Authorization': 'Bearer ' + current_token,
                        },
                        url: `https://api.spotify.com/v1/artists/${id}/top-tracks?${querystring.stringify({ market: "IN" })}`
                    }
                    return axios(option);
                });
                axios.all(requests)
                    .then((responses) => {
                        const tracksURIs = [];
                        responses.forEach((response) => {
                            const tracks = response.data.tracks.slice(1, 5)
                            tracks.forEach((track) => {
                                tracksURIs.push(track.uri);
                            })
                        })
                        return tracksURIs;
                    })
                    .then((data) => {
                        console.log(data.length);
                        const optionsForAddingTracks = {
                            method: "POST",
                            headers: {
                                'Authorization': 'Bearer ' + current_token,
                                'Content-Type': 'application/json'
                            },
                            url: `https://api.spotify.com/v1/playlists/${info.pl_id}/tracks`,
                            data: {
                                uris: (data.length > 50) ? data.slice(1, 51) : data
                            }
                        };
                        axios(optionsForAddingTracks)
                            .then((response) => {
                                console.log(response.data);
                                res.json(info);
                            })
                            .catch((err) => {
                                console.log("ERROR: Artits Tracks could not be added");
                            })

                    })
                    .catch((err) => {
                        console.log("ERROR: Top tracks of Artist failed to fetch");
                    })
            })
            .catch((err) => {
                console.log("ERROR: Playlist error for top artits");
            })
    } else {
        console.log("ERROR: Calling api before token generation");
    }
})




//api to create playlist(empty)
app.post("/createplaylist/:user_id/:playlist_name", (req, res) => {
    if (current_token) {
        const { user_id, playlist_name } = req.params;
        const trackURIs = req.body.map((track) => {
            return track.uri;
        });
        const optionsForPlaylistCreation = {
            method: "POST",
            headers: {
                'Authorization': 'Bearer ' + current_token,
                'Content-Type': 'application/json'
            },
            url: `https://api.spotify.com/v1/users/${user_id}/playlists`,
            data: {
                name: playlist_name
            }
        };
        axios(optionsForPlaylistCreation)
            .then((response) => {
                const data = response.data;
                const info = {
                    pl_id: data.id,
                    pl_url: data.external_urls.spotify
                }
                console.log("PLAYLIST CREATED");
                const optionsForAddingTracks = {
                    method: "POST",
                    headers: {
                        'Authorization': 'Bearer ' + current_token,
                        'Content-Type': 'application/json'
                    },
                    url: `https://api.spotify.com/v1/playlists/${info.pl_id}/tracks`,
                    data: {
                        uris: trackURIs
                    }
                }
                axios(optionsForAddingTracks)
                    .then((response) => {
                        console.log(response.data);
                        res.json(info);
                    })
                    .catch((err) => {
                        console.log("ERROR: Top Tracks could not be added");
                    })

            })
            .catch((err) => {
                console.log("ERROR: Playlist error ");
            })
    } else {
        console.log("ERROR: Calling api before token generation");
    }

});


app.listen(PORT, () => console.log("Server is running..."));