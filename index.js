#!/usr/bin/env nodejs
const axios = require("axios");
const crypto = require("crypto");
const xml2js = require("xml2js");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { request } = require("http");

const app = express();
app.use(express.json());
dotenv.config();

app.all("/recordings", (req, res) => {
    var recordings = [];
    const servers = process.env.RECORDING_SERVERS.split(" ");
    const secrets = process.env.RECORDING_SECRETS.split(" ");
    const requests = makeRequests(servers, secrets);
    axios
        .all(requests)
        .then(
            axios.spread((...responses) => {
                for (var j = 0; j < responses.length; j++) {
                    const parser = xml2js.parseString;
                    parser(responses[j].data, (err, result) => {
                        const parsedXML = result.response.recordings[0].recording;
                        var jsonConverted = JSON.parse(JSON.stringify(parsedXML));
                        for (var i = 0; i < jsonConverted.length; i++) {
                            var toPush = {
                                startTime: jsonConverted[i].startTime.toString(),
                                recordID: jsonConverted[i].recordID.toString(),
                                meetingID: jsonConverted[i].meetingID.toString(),
                                playback: jsonConverted[i].playback[0].format[0].url.toString(),
                            };
                            recordings.push(toPush);
                        }
                    });
                }
                console.log(recordings.length);
                res.send(recordings);
            })
        )
        .catch((errors) => {
            res.status(400).send(errors.message);
        });
});

app.all("/recordings/delete", (req, res) => {
    const servers = process.env.RECORDING_SERVERS.split(" ");
    const secrets = process.env.RECORDING_SECRETS.split(" ");
    const playback = req.body.playback;
    const recordID = req.body.recordID;
    var request = null;
    servers.forEach((server, index) => {
        if (playback.includes(server)) {
            const call = "deleteRecordings";
            const params = "recordID=" + recordID;
            const mix = call + params + secrets[index];
            var shasum = crypto.createHash("sha1");
            shasum.update(mix);
            const checksum = shasum.digest("hex");
            const url =
                server + "/bigbluebutton/api/" + call + "?" + params + "&checksum=" + checksum;
            request = axios.get(url);
        }
    });
    request
        .then((response) => {
            res.status(200).send("success");
        })
        .catch((errors) => {
            res.status(400).send("error");
        });
});

function makeRequests(servers, secrets) {
    var requests = [];
    servers.forEach((server, index) => {
        const secret = secrets[index];
        const call = "getRecordings";
        const mix = call + secret;
        var shasum = crypto.createHash("sha1");
        shasum.update(mix);
        const checksum = shasum.digest("hex");
        const url = server + "/bigbluebutton/api/" + call + "?checksum=" + checksum;
        const request = axios.get(url);
        requests.push(request);
    });
    return requests;
}

app.use(cors());
app.listen(process.env.SERVER_PORT, () => {
    console.log("Server Started On http://localhost:" + process.env.SERVER_PORT);
});
