# playListify-Backend
This is the backend for the my project [playListify](https://github.com/chetas411/playListify-Frontend)

## How it works
The code is written with reference to the [Spotify Web Api](https://developer.spotify.com/documentation/web-api/). I am just making requests to the required endpoints and setting headers and all the parameters needed to get specific data as instructed in the API documentation. No external library is used to work with API, I have just followed the documentaion.

## Running Locally
You need to have [Node](https://nodejs.org/en/) installed on your machine.<br>
*1. Clone the github respository and install all the dependencies*
```
git clone https://github.com/chetas411/playListify-Backend.git
cd playlistify-Backend
npm install
```
*2. Run auth_url_script.js file for generating the auth url to be used in frontend*
```
node auth_url_script
```
*3. Create .env file  by following the .env.example file and add all the credential values obtained from Spotify*

*4. Now run the server by `npm start`*
