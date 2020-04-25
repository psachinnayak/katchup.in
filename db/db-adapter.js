import { MeetingsDb } from "./meetings.js";
import { ClientsDb } from "./clients.js";

export class DbAdapter {
    static getMeetingsDbAccessLayer() {
        return new MeetingsDb();
    }
    static getClientsDbAccessLayer(){
        return new ClientsDb();
    }
}