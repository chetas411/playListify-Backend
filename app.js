require('dotenv').config();
const express = require("express");
const querystring = require("querystring");
const url = require("url");
const axios = require("axios");
const app = express();

const PORT = process.env.PORT || 5000;

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
const scope = 'user-read-private user-read-email user-top-read';

app.get("/",(req,res)=>{
   res.send("You are viewing localhost: 5000")
});

app.get("/login",(req,res)=>{

    //redirecting to "authorize" endpoint
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


app.get("/callback",(req,res)=>{
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
            const options = {
                method: "GET",
                headers: {'Authorization': 'Bearer ' + access_token},
                url: 'https://api.spotify.com/v1/me/top/tracks'
            }
            axios(options)
            .then((response)=>{
                // console.log(response.data);
                res.json(response.data);
                const data = response.data.items;
                data.forEach((item)=>{
                    console.log(item.name);
                })
            })
            .catch((err)=>{
                console.log(err);
            })
            
        })
        .catch((err)=>{
            console.log("error");
        })
        
    }
});


app.listen(PORT,()=>console.log("Server is running..."));