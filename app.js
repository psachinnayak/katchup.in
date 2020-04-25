import express from "express";
import http from "http";

import { createRouter } from "./api/index.js";
import BodyParser from "body-parser";
import SocketIo from "socket.io"
import {SocketIoHandler} from "./socket-io-handler.js"
// const express = require("express");

let app = express();
let httpServer = http.createServer(app);
let io = SocketIo(httpServer);


SocketIoHandler.attachHandler(io, app);

app.use(BodyParser.json());
app.use((req, res, next) => {
    let debug = false;
    if (debug) {
        console.log("Body incoming is ", req.body);
    }
    next();
});
app.use("/api", createRouter());

app.use(express.static("build"));
let port = 5200;
httpServer.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
