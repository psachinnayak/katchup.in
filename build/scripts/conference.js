((window, document, _f) => {
    function txtSearch_keypress() {
        let txt = _f.byId("txtSearch").value;

    }
    let isPanelsHidden = false;

    let localStream = null;

    function mouseMoveEvent() {
        if (isPanelsHidden) {
            unhidePanels();
        }
    }

    let hideTimeout = null;
    function hidePanels() {
        if (hideTimeout) {
            clearTimeout(hideTimeout);
        }
        hideTimeout = setTimeout((
        ) => {
            // _f.byId("rightPanel").style.display = "none";
            _f.byId("footerPanel").style.display = "none";
            isPanelsHidden = true;
        }, 2000);
    }

    function unhidePanels() {
        if (hideTimeout) {
            clearTimeout(hideTimeout);
        }
        // _f.byId("rightPanel").style.display = "block";
        _f.byId("footerPanel").style.display = "block";
        isPanelsHidden = false;
        setTimeout(hidePanels, 5000);
        // hideTimeout()
    }

    function displayPopup(msg) {
        console.log(msg);
        _f.byId("txtFlashMessages").appendChild(document.createTextNode(msg));
        unhidePanels();
        setTimeout(() => {
            _f.byId("txtFlashMessages").childNodes[0].remove()
        }, 5000);
    }
    function bringToFocus(participant) {

    }

    function displayStream(participant) {
        let vidElem = participant.videoElement;
        let noStreamElem = participant.noStreamElem;
        let stream = participant.stream;
        if (stream && stream.active) {

            console.log("Got Stream for ", participant.id);
            // vidElem.stop();
            // console.log(vidElem.)
            console.log("displayStream called with stream which is null?", stream == null);
            // debugger;
            let aspect = stream.getVideoTracks()[0].getSettings().aspectRatio;

            if (!aspect) {
                aspect = 0.7;
            }
            console.log(`${aspect} * ${_f.byId("rightPanel").offsetWidth}`);
            newHeight = aspect * parseInt(_f.byId("rightPanel").offsetWidth);
            vidElem.style.width = "100%";
            vidElem.style.height = newHeight + "px";
            vidElem.srcObject = stream;
            console.log(`Setting width, height for video as 100% x ${newHeight}`)

            // vidElem.style.display = "block";
            // if (!vidElem.playing) {
            //     vidElem.play();
            // }
            // noStreamElem.style.display = "none";
        }
        else {
            // vidElem.style.display = "none";
            // noStreamElem.style.display = "block";
        }
    }
    function renderParticipant(participant) {

        let vidElem = document.createElement("video");
        let noStreamElem = document.createElement("div");
        noStreamElem.appendChild(document.createTextNode("V"));

        participant.videoElement = vidElem;
        participant.noStreamElem = noStreamElem;

        vidElem.setAttribute("autoplay", true);
        displayStream(participant);
        let elem = document.createElement("div");
        elem.appendChild(vidElem);
        elem.appendChild(noStreamElem)
        let txtHolder = document.createElement("div");
        elem.appendChild(txtHolder);
        txtHolder.appendChild(document.createTextNode(participant.name));
        // participant
        if (participant.isMe) {
            txtHolder.style.display = "none";
            _f.byId("mainPanel").appendChild(elem);
        } else {
            _f.byId("rightPanel").appendChild(elem);
        }
        let muteIcon = document.createElement("i");
        muteIcon.classList.add("fa");
        muteIcon.classList.add("fa-microphone-slash");
        muteIcon.classList.add("overlay-mute-button");
        elem.appendChild(muteIcon);
        participant.renderedElement = elem;
    }

    let _c = new ConferenceFramework({ renderParticipant: renderParticipant });

    async function btnJoinMeeting_click() {
        console.log("btnJoinMeeting_click called");
        let katchupId = _f.byId("txtMeetingId").value;
        let participantName = _f.byId("txtParticipantName").value;
        try {
            let response = await _f.post("/api/meetings/join", { katchupId, participantName });
            console.log(`response for join_post is ${JSON.stringify(response)}`);
            $("#modalJoinMeeting").modal('hide');
            // if (document.body.requestFullscreen) {
            //     document.body.requestFullscreen();
            // }
            beginListeningOnSocket({ katchupId, clientId: response.clientId });
        } catch (err) {
            alert(err);
        }
    }
    let socket = null;
    let peerConnections = {};


    function requestPeerConnection({ clientId }) {
        let clientIdWhosePeerRequested = clientId;
        let myClientId = _c.myClientId;

        socket.emit("message", {
            eventId: "request-for-peer",
            requester: myClientId,
            requestTo: clientIdWhosePeerRequested
        });

    }
    function beginListeningOnSocket({ katchupId, clientId }) {
        console.log(`my client id is ${clientId}`);
        _c.myClientId = clientId;
        _c.myMeetingId = katchupId;

        socket.on("message", ({ eventId, ...msg }) => {
            // console.log(`Got a message with eventId ${eventId}. Message is ${JSON.stringify(msg)}`);
            switch (eventId) {
                case "existing-participant": {
                    let newParticipant = new Participant(msg.clientId, {
                        name: msg.participantName
                    });
                    _c.addParticipant(newParticipant);

                    setTimeout(function ({ clientId }) {
                        requestPeerConnection({ clientId });
                    }.bind(null, {
                        clientId: msg.clientId
                    }), 0);
                } break;
                case "new-participant": {
                    let newParticipant = new Participant(msg.clientId, {
                        name: msg.participantName
                    });
                    _c.addParticipant(newParticipant);
                    displayPopup(`${newParticipant.name} has joined this meeting.`)
                } break;
                case "request-for-peer": {
                    let peerConnection = createPeerConnection(msg.requester, true);
                    peerConnections[msg.requester] = peerConnection;
                    console.log(`sending peer connection event to ${msg.requester}`);

                } break;
                case "peer-connection": {
                    let peerConnection = createPeerConnection(msg["from-peer"], false);
                    peerConnections[msg["from-peer"]] = peerConnection;
                    // console.log(`Message for peer-connection : ${JSON.stringify(msg)}`)
                    peerConnection.setRemoteDescription(msg.sdp)
                        .then(() => {
                            return peerConnection.createAnswer();
                        }).then((answer) => {
                            peerConnection.setLocalDescription(answer);
                        }).then(() => {
                            socket.emit("message", {
                                eventId: "peer-answer",
                                target: msg["from-peer"],
                                "from-peer": _c.myClientId,
                                sdp: peerConnection.localDescription
                            });
                        });
                } break;
                case "peer-answer": {
                    console.log("Peer-Answer ", msg["from-peer"]);
                    let answerPeerId = msg["from-peer"];
                    let peer = peerConnections[answerPeerId];
                    if (peer) {
                        peer.setRemoteDescription(msg.sdp);
                    }


                } break;
                case "new-ice-candidate": {
                    console.log(`********Got new ice candidate for ${msg.candidateClientId}`)
                    let connection = peerConnections[msg.candidateClientId];
                    connection.addIceCandidate(msg.candidate);
                } break;
                case "exiting-participant": {
                    console.log(`Client Id exiting is ${msg.clientId}`);
                    let connection = peerConnections[msg.clientId];
                    delete peerConnections[msg.clientId];
                    if (connection) {
                        connection.close();
                    }
                    let participant = _c.findById(msg.clientId);
                    if (participant) {
                        _c.removeParticipant(participant);
                        let elem = participant.renderedElement
                        elem.remove();
                        displayPopup(`${participant.name} has exited from the meeting.`);
                    }
                } break;

            }
        });

        console.log("Emitting Joining-meeting for ${clientId}");
        socket.emit("message", {
            eventId: "joining-katchup",
            clientId,
            katchupId
        });
    }

    function onIceCandidate(targetClientId, event) {
        console.log(`***** onIceCandidate on ${targetClientId}`);
        if (event.candidate) {
            console.log(`***** emiting candidate to ${targetClientId} from ${_c.myClientId}`);
            currentCandidate = event.candidate;
            socket.emit("message", {
                eventId: "new-ice-candidate",
                target: targetClientId,
                candidateClientId: _c.myClientId,
                candidate: event.candidate
            });
        }
    }



    function onNegotiationNeeded(targetClientId, isInitiator) {
        let myPeerConnection = this;
        if (isInitiator) {
            myPeerConnection.createOffer()
                .then((offer) => {
                    console.log("onNegotiationNeeded localDesc is ", myPeerConnection.localDescription);
                    return myPeerConnection.setLocalDescription(offer);
                }).then(() => {
                    console.log(`Emitting message for peer-connection ${targetClientId}`);
                    socket.emit("message", {
                        eventId: "peer-connection",
                        target: targetClientId,
                        "from-peer": _c.myClientId,
                        sdp: myPeerConnection.localDescription
                    });
                })
        }
        console.log("onNegotitationNeeded");
    }

    function createPeerConnection(targetClientId, isInitiator) {

        let myPeerConnection = new RTCPeerConnection({
            iceServers: [{
                urls: "turn:localhost:3478",
                username: "sachin",
                credential: "webrtcdemo"
            }]
        });

        console.log(`createing peer connection for ${targetClientId}`);
        myPeerConnection.onicecandidate = onIceCandidate.bind(myPeerConnection, targetClientId);
        myPeerConnection.onnegotiationneeded = onNegotiationNeeded.bind(myPeerConnection, targetClientId, isInitiator);
        myPeerConnection.ontrack = onTrackOnPeer.bind(myPeerConnection, targetClientId);
        myPeerConnection.onaddtrack = (event) => {
            console.log("onAddTrack");
        };
        myPeerConnection.onremovetrack = (event) => {
            console.log("onRemoveTrack");
        }

        if (localStream) {
            console.log(`Sending local Stream to participant ${targetClientId}`);
            myPeerConnection.addStream(localStream);
        } else {
            console.error("LocalStream is null, so not setting stream");
        }
        return myPeerConnection;
    }
    function onTrackOnPeer(targetClientId, event) {
        console.log("Track on Peer got");
        let participant = _c.findById(targetClientId);
        if (participant) {
            console.log("Setting stream");
            participant.stream = event.streams[0];
            displayStream(participant);
            // event.streams[0].getAudioTracks()[0].onended = () => {
            //     console.log("audio track ended");
            // };
            // event.streams[0].getAudioTracks()[0].onmute = () => {
            //     console.log("audio track muted");
            // };
            // event.streams[0].getAudioTracks()[0].onunmute = () => {
            //     console.log("audio track unmuted");
            // };
            // event.streams[0].getVideoTracks()[0].onended = () => {
            //     console.log("video track ended");
            // }; event.streams[0].getVideoTracks()[0].onmute = () => {
            //     console.log("video track muted");
            // }; event.streams[0].getVideoTracks()[0].onunmute = () => {
            //     console.log("video track unmuted");
            // };
        }
    }

    function btnMute_click() {
        if (localStream) {
            console.log("Mute ", localStream.getAudioTracks()[0].enabled);
            localStream.getAudioTracks()[0].enabled = !localStream.getAudioTracks()[0].enabled;
            if (localStream.getAudioTracks()[0].enabled) {
                _f.byId("btnMute").querySelector("i").classList.remove("fa-microphone-slash");
                _f.byId("btnMute").querySelector("i").classList.add("fa-microphone")
            } else {
                _f.byId("btnMute").querySelector("i").classList.add("fa-microphone-slash");
                _f.byId("btnMute").querySelector("i").classList.remove("fa-microphone")
            }
        }
    }
    function btnDisconnect_click() {
        socket.emit("leaving-katchup", {
            clientId: _c.myClientId,
            katchupId: _c.myMeetingId
        });

        _c.participants.forEach((p) => {
            if (!p.isMe) {
                console.log(`Attempting to close peer connection for ${p.id}`);
                if (peerConnections[p.id]) {
                    console.log(`CLosing Peer connection for ${p.id}`);
                    peerConnections[p.id].close();
                }
                delete peerConnections[p.id];
            }
            _c.removeParticipant(p);
        });
        socket.disconnect();
        socket.connect();

        $("#modalJoinMeeting").modal('show');

        // socket.emit()
    }
    function btnVideo_click() {
        if (localStream) {
            console.log("Video ", localStream.getVideoTracks()[0].enabled);
            localStream.getVideoTracks()[0].enabled = !localStream.getVideoTracks()[0].enabled;
            if (localStream.getVideoTracks()[0].enabled) {
                _f.byId("btnVideo").querySelector("i").classList.remove("fa-video-slash");
                _f.byId("btnVideo").querySelector("i").classList.add("fa-video")
            } else {
                _f.byId("btnVideo").querySelector("i").classList.add("fa-video-slash");
                _f.byId("btnVideo").querySelector("i").classList.remove("fa-video")
            }
        }
    }
    async function main() {
        _f.byId("txtParticipantName").value += ` ${new Date().getSeconds()}`;
        _f.on("txtSearch", "keyup", txtSearch_keypress);
        _f.on(window, "mousemove", mouseMoveEvent);
        _f.on("btnMute", "click", btnMute_click);
        _f.on("btnVideo", "click", btnVideo_click);
        _f.on("btnDisconnect", "click", btnDisconnect_click);
        _f.on("btnJoinMeeting", "click", btnJoinMeeting_click);
        hidePanels();
        socket = io();

        $("#modalJoinMeeting").modal('show');
        navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
            // To get  rear camera
            // video: { facingMode: { exact: "environment" } }
        }).then((media) => {
            console.log("Got stream media");
            localStream = media;
            let vidElem = _f.byId("myVideo");

            let aspect = localStream.getVideoTracks()[0].getSettings().aspectRatio;
            vidElem.style.width = "100%";
            vidElem.style.height = aspect * parseInt(_f.byId("rightPanel").offsetWidth);
            vidElem.srcObject = localStream;
        })

    }

    _f.on(window, "load", main);
})(window, document, _f);