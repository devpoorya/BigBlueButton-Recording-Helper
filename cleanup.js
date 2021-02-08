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
const diffLimit = 8;

app.all("/recordings", (req, res) => {
    var recordings = [];
    const servers = process.env.RECORDING_SERVERS.split(" ");
    const secrets = process.env.RECORDING_SECRETS.split(" ");
    const requests = makeRequests(servers, secrets);
    var oldCount = 0;
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
                            var unix = jsonConverted[i].startTime.toString();
                            var recDate = new Date(parseInt(unix));
                            var nowDate = new Date();
                            const diffInMs = Math.abs(nowDate - recDate);
                            const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
                            var toPush = {
                                startTime: recDate,
                                recordID: jsonConverted[i].recordID.toString(),
                                meetingID: jsonConverted[i].meetingID.toString(),
                                playback: jsonConverted[i].playback[0].format[0].url.toString(),
                            };
                            if (diffInDays > diffLimit) {
                                oldCount++;
                                deleteRecordings(servers[0], secrets[0], toPush.recordID);
                            }
                        }
                    });
                }
                console.log(oldCount);
                res.send("Clean Up Successful!");
            })
        )
        .catch((errors) => {
            res.status(400).send(errors.message);
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

function deleteRecordings(server, secret, id) {
    var call = "deleteRecordings";
    var params = "recordID=" + id;
    var mix = call + params + secret;
    var shasum = crypto.createHash("sha1");
    shasum.update(mix);
    var checksum = shasum.digest("hex");
    var url = server + "/bigbluebutton/api/" + call + "?" + params + "&checksum=" + checksum;
    var request = axios.get(url);
}

app.use(cors());
app.listen(process.env.SERVER_PORT, () => {
    console.log("Server Started On http://localhost:" + process.env.SERVER_PORT);
});
