import { Controller } from "../../framework/controller.js";


class JoinPost extends Controller {

    get schema() {
        return {
            body: {
                katchupId: {
                    required: true,
                    type: "string",
                    minLength: 9,
                    maxLength: 9
                }
            }
        }
    }
    async internalExecute({ body, clientIp, userAgent }) {
        let katchupId = body.katchupId;
        let participantName = body.participantName;
        const meetingDb = await Controller.getMeetingDbAccess();
        let katchupDetails = await meetingDb.getByKatchupId(katchupId);


        // TBD - If the meeting details are found, check if password is needed or not.
        if (katchupDetails && !katchupDetails.is_ended) {

            const clientsDb = await Controller.getClientsDbAccess();

            let clientDetails = { clientIp, userAgent };

            let clientId = await clientsDb.insertNewClient(clientDetails);
            if (!clientId) {
                throw new Error("Unable to allow joining a meeting");
            }
            else {

                let isSuccess = await meetingDb.addNewClientForMeeting({
                    katchupId, clientId, participantName
                });
                return {
                    response: {
                        katchupId,
                        clientId
                    }
                };
            }
        } else {
            return {
                statusCode: 404,
                response: {
                    message: "No such meeting"
                }
            }
        }


    }

}

export { JoinPost as Controller };