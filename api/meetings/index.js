
import express from "express";
import { Helpers } from "../../framework/helpers.js";

import { Controller as JoinPostController } from "./join_post.js";


function createRouter() {
    let router = express.Router();
    router.post("/join", Helpers.createController(JoinPostController));

    return router;
}

export { createRouter };