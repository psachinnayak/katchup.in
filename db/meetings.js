import { DataAccessLayer } from "./data-access-layer.js";

export class MeetingsDb extends DataAccessLayer {
    constructor() {
        super();
    }


    async getByKatchupId(katchupId) {
        if (typeof (katchupId) != "string" || !katchupId) {
            throw new Error("Invalid Katchup Id");
        }

        let client = await this.getDbClient();

        let meetingCollections = client.collection("meetings");

        let meeting = await meetingCollections.findOne({ _id: katchupId });

        return meeting;
    }

    async addNewClientForMeeting({katchupId, clientId, participantName}) {
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


        return (success.error == null);
    }

}