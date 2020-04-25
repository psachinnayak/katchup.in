import express from "express";
import {createRouter as MeetingsRouter} from "./meetings/index.js";


function createRouter() {
    let router = new express.Router();
    router.use("/meetings", MeetingsRouter());

    return router;
}


export  {createRouter};