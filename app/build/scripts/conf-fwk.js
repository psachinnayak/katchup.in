
class Emitter {
    constructor() {
        this.handlers = {}
    }
    raise(event, eventParams) {
        if (event) {
            event = event.toLowerCase();
            if (this.handlers[event]) {
                this.handlers[event].forEach((handler) => {
                    setTimeout(() => {
                        handler(eventParams);
                    }, 0);
                });
            }
        }
    }
    on(event, handler) {
        if (event) {
            event = event.toLowerCase();
            if (!this.handlers[event]) {
                this.handlers[event] = [];
            }
            this.handlers[event].push(handler);
        }
    }

}


class Participant extends Emitter {
    constructor(id, { name, isMe }) {
        super();
        if (!id) {
            throw new Error("id is mandatory for Participant");
        }
        this._id = id;
        this.name = name;
        this.searchableName = name.toLowerCase();
        this._isMe = isMe;
    }
    nameContains(searchText) {
        return (this.searchableName.indexOf(searchText) > -1);
    }

    get id() {
        return this._id;
    }
    get isMe() {
        return this._isMe;
    }

    get stream() {
        return this._stream;
    }
    set stream(stream) {
        if (this._stream) {
            // remove the older handlers
            // let videoTracks = this._stream.getVideoTracks();
            // if(videoTracks && videoTracks.length>0){
            //     // videoTracks[0].
            // }
        }

        this._stream = stream;
        if (stream) {
            this.raise("on-stream-set", {
                stream: stream,
                participant: this
            });
        } else {
            this.raise("on-stream-unset", {
                stream: stream,
                participant: this
            });
        }
        // if (stream) {
        //     // Add new Handlers

        // }
    }
}

class ConferenceFramework extends Emitter {
    constructor({ renderParticipant }) {
        super();
        this.participants = [];
        this.renderParticipant = renderParticipant;
    }


    findById(id) {
        // this.participants.forEach((p)=>{
        //     console.log("Participant is ", p.id);
        // })
        // console.log()
        return this.participants.find((p) => (id == p.id))
    }
    findByName(txt) {
        txt = txt.toLowerCase();
        return this.participants.find((p) => p.nameContains(txt));
    }
    findMe() {
        return this.participants.find((p) => p.isMe);
    }

    addParticipant(participant) {
        if (this.findById(participant.id)) {
            throw new Error("Duplicate Participant");
        }
        this.participants.push(participant);

        this.renderParticipant(participant);
        this.raise("participant-added", { participant });
    }

    removeParticipant(participant){
        this.raise("participant-removed", { participant });
        delete this.participants[participant.clientId];
    }

    raise(event, eventParams) {

    }

}