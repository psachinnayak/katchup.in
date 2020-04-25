import MongoDb from "mongodb";


export class DataAccessLayer {
    static #dbClient = null;


    static async  instantiateDbClient() {
        const url = 'mongodb://localhost:27017/katchup-db';

        const client = new MongoDb.MongoClient(url);

        await client.connect();

        client.db();

        return client;
    }

    async getDbClient() {
        if (!DataAccessLayer.#dbClient) {
            DataAccessLayer.#dbClient = await DataAccessLayer.instantiateDbClient();
        }
        return DataAccessLayer.#dbClient.db();
    }
}