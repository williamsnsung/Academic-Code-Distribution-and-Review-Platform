import {disconnectDB, initDB} from "../Database/dbAgent.js";

global.beforeAll(async () => {
    await initDB();
});

global.afterAll(() => {
    disconnectDB();
});