import { DataAccessLayer } from "./data-access-layer.js";
import ShortId from "shortid";

export class ClientsDb extends DataAccessLayer {
    constructor() {
        super();
    }

    async insertNewClient(clientDetails) {
        let client = await this.getDbClient();

        let meetingCollections = client.collection("clients");

        // Attempt three times to generate a new shortid and insert into db
        let clientId = ShortId.generate();
        clientDetails._id = clientId;
        let success = await meetingCollections.insertOne(clientDetails);
        if (success.error) {
            clientId = ShortId.generate();
            clientDetails._id = clientId;
            success = await meetingCollections.insertOne(clientDetails);
            if (success.error) {
                clientId = ShortId.generate();
                clientDetails._id = clientId;
                success = await meetingCollections.insertOne(clientDetails);
            }
        }
        return (success.error == null) ? clientId : null;
    }
    async getClientsByMeetingId(){

    }
}