const Turn = require("node-turn");


const server = new Turn({
    authMech:"long-term",
    credentials:{
        "user":"password"
    },
    listeningIps:["0.0.0.0"]
})


server.start()
console.log("Started TURN Server");