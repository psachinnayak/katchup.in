import { Controller } from "./framework/controller.js";

export class SocketIoHandler {

    static #sockets = {};
    static attachHandler(io) {
        io.on('connection', (socket) => {
            console.log('a user connected');
            socket.on('disconnect', () => {
                console.log(`arguments ${JSON.stringify(arguments.length)}`);
                // connections = connections.filter((elem) => elem != socket);
                let clients = Object.getOwnPropertyNames(SocketIoHandler.#sockets);
                for (let prop in clients) {
                    let clientId = clients[prop];
                    if (socket == SocketIoHandler.#sockets[clientId]) {
                        // Mark the client id as disconnected
                        let katchupId = socket.katchupId;
                        let disconnectingClientId = socket.clientId;
                        // Mark as disconnected in DB

                    }
                }
            });


            socket.on('message', (msg) => {
                console.log(`Got a message ${JSON.stringify(msg)}`)
                switch (msg.eventId) {
                    case "joining-katchup":
                        console.log(`${msg.clientId} is joining meetingId ${msg.katchupId}`);
                        SocketIoHandler.handleParticipantJoining(socket, msg);
                        break;
                    case "leaving-katchup":
                        console.log(`${msg.clientId} is leaving from meetingId ${msg.katchupId}`);
                        SocketIoHandler.handleParticipantLeaving(socket, msg);
                        break;
                    case "request-for-peer":
                        SocketIoHandler.routeMessage(socket, msg.requestTo, msg);
                        break;
                    case "new-ice-candidate":
                        SocketIoHandler.routeMessage(socket, msg.target, msg);
                        break;
                    case "peer-connection":
                        SocketIoHandler.routeMessage(socket, msg.target, msg);
                        break;
                    case "peer-answer":
                        SocketIoHandler.routeMessage(socket, msg.target, msg);
                        break;

                }
            });
        });
    }
    static async  handleParticipantJoining(socket, msg) {
        // TBD verify that the client Id is from the right IP address
        socket.clientId = msg.clientId;
        SocketIoHandler.#sockets[msg.clientId] = socket;
        let katchupId = msg.katchupId;
        let meetingDetails = await Controller.getMeetingDbAccess().getByKatchupId(katchupId);


        if (meetingDetails) {
            let newParticipantName = null;


            meetingDetails.participants.forEach((participant) => {
                console.log(`Participant ${participant.client_id} != ${msg.clientId}`);
                if (participant.client_id == msg.clientId) {
                    newParticipantName = participant.participant_name;
                }
            });

            meetingDetails.participants.forEach((participant) => {
                console.log(`Participant ${participant.client_id} != ${msg.clientId}`);
                if (participant.client_id != msg.clientId) {
                    let socketToInform = SocketIoHandler.#sockets[participant.client_id];
                    if (socketToInform) {
                        socketToInform.emit("message", {
                            eventId: "new-participant",
                            clientId: msg.clientId,
                            participantName: newParticipantName
                        });
                        // Also let the currently joining participant that there are others.
                        socket.emit("message", {
                            eventId: "existing-participant",
                            clientId: participant.client_id,
                            participantName: participant.participant_name
                        })
                    }
                }
            });
            // console.log(`about to emit new-participant to ${socketsToInform.length} clients`);

        }
    }
    static handleParticipantLeaving(socket, msg) {

    }
    static routeMessage(socket, target, msg) {
        let clientRequested = SocketIoHandler.#sockets[target];
        if (clientRequested) {
            clientRequested.emit("message", msg)
        }
    }
}