# BigBlueButton - Multi Server Recording Helper

This repo is a BigBlueButton Multi Server Recording Helper written in node.js and consists of 2 tools.

## 1. Recording Retriever

The index.js file uses the servers urls declared in .env file which are seperated by spaces as shown in the examples.
The pattern of the server secrets are simillar to server urls.

There are 2 endpoints in this file.

    1. /recordings

    Automatically sends multiple simultaneous requests to fetch all the recordings from multiple servers, parses the XML and outputs a prettier and more elegant JSON which can be interpreted in any programming language.

    2. /recordings/delete

    Gets the playback url and meetingID, finds the propper server and deleted the desired recording.

## 2. Clean Up

BigBlueButton isn't really known for the great CLI it provides to manage and delete recordings.
This tool provied a simple way to delete all recording older than the desired number of days at any given moments and eliminates the need to wait for the daily cron jobs and the janky systems that BigBlueButton it self uses.

### All the following tasks are done using the offical BigBlueButton API and there is no private API or hack invloved.

### This tool is dependent on

-   [axios/axios](https://github.com/axios/axios)
-   [Gozala/crypt](https://github.com/Gozala/crypto)
-   [Leonidas-from-XIV/node-xml2js](https://github.com/Leonidas-from-XIV/node-xml2js)
-   [expressjs/express](https://github.com/expressjs/express)
-   [expressjs/cors](https://github.com/expressjs/cors)
-   [motdotla/dotenv](https://github.com/motdotla/dotenv)

### Install dependencies by running

`npm install`
