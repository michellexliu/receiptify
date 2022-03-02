/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */
const express = require("express"); // Express web server framework
const request = require("request");
// const axios = require("axios"); // "Request" library
// const bodyParser = require("body-parser");
// const cors = require("cors");
const querystring = require("querystring");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const jwt = require("jsonwebtoken");
// const https = require("https");
// const exphbs = require("express-handlebars");
const cors = require("cors");
// const { config } = require("./config");
require("dotenv").config();

const client_id = process.env.clientID; // Your client id
const client_secret = process.env.clientSecret; // Your secret
const privateKey = fs.readFileSync("AuthKey_A8FKGGUQP3.p8").toString();
const teamId = process.env.teamId;
const keyId = process.env.keyId;

// var redirect_uri = "https://receiptify.herokuapp.com/callback"; // Your redirect uri
var redirect_uri = "http://localhost:3000/callback";
/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated stringh
 */
var generateRandomString = function (length) {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = "spotify_auth_state";

var app = express();
// app.engine("handlebars", exphbs({ defaultLayout: null }));
// app.set("view engine", "handlebars");
// app.set("views", __dirname + "/views");
app
  .use(express.static(__dirname + "/public"))
  .use(cors())
  .use(cookieParser());

app.get("/login", function (req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = "user-read-private user-read-email user-top-read";
  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state,
      })
  );
});

app.get("/applemusic", function (req, res) {
  const token = jwt.sign({}, privateKey, {
    algorithm: "ES256",
    expiresIn: "180d",
    issuer: teamId,
    header: {
      alg: "ES256",
      kid: keyId,
    },
  });

  res.redirect(
    "/#" +
      querystring.stringify({
        client: "applemusic",
        dev_token: token,
      })
  );
  // res.redirect("https://idmsa.apple.com/IDMSWebAuth/auth?" + querystring.stringify({}))
  // let music = MusicKit.getInstance();
  // music.authorize().then(console.log("hello"));
  // res.sendFile(__dirname + "/public/applemusic.html");
});

app.get("/lastfm", function (req, res) {
  // res.redirect(
  //   "/#" +
  //     querystring.stringify({
  //       lastfmKey: lastfmKey,
  //       service: "lastfm"
  //     })
  // );
  res.sendFile(__dirname + "/public/lastfm.html");
});

app.get("/callback", function (req, res) {
  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect(
      "/#" +
        querystring.stringify({
          error: "state_mismatch",
        })
    );
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: "https://accounts.spotify.com/api/token",
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: "authorization_code",
      },
      headers: {
        Authorization:
          "Basic " +
          new Buffer(client_id + ":" + client_secret).toString("base64"),
      },
      json: true,
    };

    request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        access_token = body.access_token;
        var access_token = body.access_token,
          refresh_token = body.refresh_token;

        res.redirect(
          "/#" +
            querystring.stringify({
              client: "spotify",
              access_token: access_token,
              refresh_token: refresh_token,
            })
        );
        // res.redirect("/spotify");
        // console.log(retrieveTracksSpotify(access_token, "short_term", 1, "LAST MONTH"));
        // res.render("spotify", {
        //   shortTerm: retrieveTracksSpotify(access_token, "short_term", 1, "LAST MONTH"),
        //   mediumTerm: retrieveTracksSpotify(access_token, "medium_term", 2, "LAST 6 MONTHS"),
        //   longTerm: retrieveTracksSpotify(access_token, "long_term", 3, "ALL TIME")
        // });
      } else {
        res.send("There was an error during authentication.");
      }
    });
  }
});

app.get("/refresh_token", function (req, res) {
  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: "https://accounts.spotify.com/api/token",
    headers: {
      Authorization:
        "Basic " +
        new Buffer(client_id + ":" + client_secret).toString("base64"),
    },
    form: {
      grant_type: "refresh_token",
      refresh_token: refresh_token,
    },
    json: true,
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        access_token: access_token,
      });
    }
  });
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server is running on port 3000");
});
