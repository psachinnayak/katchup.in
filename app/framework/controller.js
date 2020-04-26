import { DbAdapter } from "../db/db-adapter.js";


export class Controller {
    async execute(req, res, next) {
        let body = req.body;
        let query = req.query;

        let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        let clientIp = {
            forwarded_for: req.headers['x-forwarded-for'],
            ip,
            remote_address: req.connection.remoteAddress
        };

        let isValid = this.validate(this.schema, "body", body);
        isValid = isValid && this.validate(this.schema, "query", query);
        let response = {
            code: -1,
            message: "Unexpected Error "
        }

        let statusCode = 200;
        if (!isValid) {
            statusCode = 400;
            response = {
                code: 1,
                message: "Required Parameters not found"
            }
        } else {
            let reply = await this.internalExecute({ body, query, clientIp, userAgent: req.headers["user-agent"] });
            if (reply.statusCode) {
                statusCode = reply.statusCode;
            }
            response = reply.response;
        }
        res.status(statusCode)
            .json(response);
    }

    validate(schema, schemaField, request) {
        let isValid = true;

        if (schema[schemaField] && !request) {
            console.warn(`${schemaField} in ${schema} is not null and ${request} is null.`)
            isValid = false;
        } else if (schema[schemaField]) {
            let validationSchema = schema[schemaField];
            console.log(`${schemaField} in ${JSON.stringify(schema)}`);
            let properties = Object.getOwnPropertyNames(validationSchema);
            for (let propIdx in properties) {
                let prop = properties[propIdx];
                console.log(`Checking ${prop} against ${JSON.stringify(validationSchema)} on body / query ${JSON.stringify(request)}`)
                let propSchema = validationSchema[prop];
                let requestProp = request[prop];
                if (propSchema.required) {
                    if (requestProp == null) {
                        console.warn(`${prop} is mandatory, but did not come in the input`);
                        isValid = false;
                    }
                }
                if (isValid) {
                    switch (propSchema.type) {
                        case "string":
                            if (propSchema.minLength != null) {
                                if (requestProp.length < propSchema.minLength) {
                                    isValid = false;
                                }
                            }
                            if (propSchema.maxLength != null) {
                                if (requestProp.length > propSchema.maxLength) {
                                    isValid = false;
                                }
                            }
                            break;
                        default:
                            break;
                    }
                }

                if (!isValid) {
                    break;
                }
                // schema[prop];
            }
        }
        return isValid;
    }

    static getMeetingDbAccess() {
        return DbAdapter.getMeetingsDbAccessLayer();
    }
    static getClientsDbAccess(){
        return DbAdapter.getClientsDbAccessLayer();
    }
}