import { Controller } from "./framework/controller.js";

export class SocketIoHandler {

    static #sockets = {};
    static attachHandler(io) {
        io.on('connection', (socket) => {
            console.log('a user connected');
            socket.on('disconnect', (one, two) => {
                if (one) {
                    console.log(`one arguments ${one.katchupId}, ${one.clientId}`);
                }
                if (two) {
                    console.log(`two arguments ${two.katchupId}, ${two.clientId}`);
                } if (socket) {
                    console.log(`socket arguments ${socket.katchupId}, ${socket.clientId}`);
                }
                console.log("Disconnect called for socket");
                SocketIoHandler.handleParticipantLeaving(socket, {
                    clientId: socket.clientId,
                    katchupId: socket.katchupId
                });

            });


            socket.on('message', (msg) => {
                // console.log(`Got a message ${JSON.stringify(msg)}`)
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
                        console.log(`******* routing ice-candidate to ${msg.target} from candidate ${msg.candidateClientId}`);
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

        let katchupId = msg.katchupId;

        socket.clientId = msg.clientId;
        socket.katchupId = katchupId;
        console.log(`******Katchup Id being set is ${katchupId}`);
        SocketIoHandler.#sockets[msg.clientId] = socket;
        let meetingDetails = await Controller.getMeetingDbAccess().getByKatchupId(katchupId);


        if (meetingDetails) {
            let newParticipantName = null;
            meetingDetails.participants.forEach((participant) => {
                if (!participant.end_time) {
                    // console.log(`Participant ${participant.client_id} != ${msg.clientId}`);
                    if (participant.client_id == msg.clientId) {
                        newParticipantName = participant.participant_name;
                    }
                }
            });

            meetingDetails.participants.forEach((participant) => {
                // console.log(`Participant ${participant.client_id} != ${msg.clientId}`);
                if (!participant.end_time) {
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
                }
            });
            // console.log(`about to emit new-participant to ${socketsToInform.length} clients`);

        }
    }
    static async handleParticipantLeaving(disconnectingSocket, msg) {

        let disconnectingClientId = msg.clientId;
        if (SocketIoHandler.#sockets[disconnectingClientId]) {
            delete SocketIoHandler.#sockets[disconnectingClientId];
        }
        if (msg.katchupId) {
            let meetingDb = await Controller.getMeetingDbAccess();
            meetingDb.endParticipant({
                katchupId: msg.katchupId,
                participantClientId: disconnectingClientId
            });

            let meetingDetails = await Controller.getMeetingDbAccess().getByKatchupId(msg.katchupId);
            meetingDetails.participants.forEach((participant) => {
                // console.log(`Participant ${participant.client_id} != ${msg.clientId}`);
                if (!participant.end_time) {
                    if (participant.client_id != disconnectingClientId) {
                        let socketToInform = SocketIoHandler.#sockets[participant.client_id];
                        if (socketToInform) {
                            socketToInform.emit("message", {
                                eventId: "exiting-participant",
                                clientId: disconnectingClientId
                            });
                        }
                    }
                }
            });
        }
    }
    static routeMessage(socket, target, msg) {
        let clientRequested = SocketIoHandler.#sockets[target];
        if (clientRequested) {
            clientRequested.emit("message", msg)
        }
    }
}