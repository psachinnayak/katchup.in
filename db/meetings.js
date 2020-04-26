import { DataAccessLayer } from "./data-access-layer.js";

export class MeetingsDb extends DataAccessLayer {
    constructor() {
        super();
    }


    async getByKatchupId(katchupId) {
        if (typeof (katchupId) != "string" || !katchupId) {
            throw new Error(`Invalid Katchup Id Value sent is "${katchupId}"`);
        }

        let client = await this.getDbClient();

        let meetingCollections = client.collection("meetings");

        let meeting = await meetingCollections.findOne({ _id: katchupId });

        return meeting;
    }

    async addNewClientForMeeting({ katchupId, clientId, participantName }) {
        if (typeof (katchupId) != "string" || !katchupId) {
            throw new Error("Invalid Katchup Id");
        }
        if (typeof (clientId) != "string" || !clientId) {
            throw new Error("Invalid Client Id");
        }
        let client = await this.getDbClient();

        let meetingCollections = client.collection("meetings");

        let success = await meetingCollections.updateOne({ _id: katchupId }, {
            $addToSet: {
                "participants": {
                    client_id: clientId,
                    signed_in: new Date,
                    participant_name: participantName
                }
            }
        });
        if (success.error) {
            console.error("Error in db.meetings.addNewClientForMeeting", success.error);
        }

        return (success.error == null);
    }

    async endParticipant({ katchupId, participantClientId }) {
        let client = await this.getDbClient();

        let meetingCollections = client.collection("meetings");

        let meeting = await meetingCollections.findOne({ _id: katchupId });

        let clientIdx = -1;
        meeting.participants.forEach((participant, idx) => {
            if (participant.client_id == participantClientId) {
                clientIdx = idx;
            }
        });

        if (clientIdx > -1) {
            let client = await this.getDbClient();

            let meetingCollections = client.collection("meetings");
            let prop = `participants.${clientIdx}.end_time`
            let obj = {

            };
            obj[prop] = new Date();
            let success = await meetingCollections.updateOne({ _id: katchupId }, {
                $set: obj
            });
            if (success.error) {
                console.error("Error in db.meetings.endParticipant", success.error);
            }
            return (success.error == null);
        } else {
            return true;
        }
    }

}