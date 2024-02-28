import * as mongo from "mongodb";

import { Errors } from "cs544-js-utils";

import * as Lib from "./library.js";

//TODO: define any DB specific types if necessary
type DbBook = Lib.XBook & { _id: string };
type DbPatreon = Lib.Patreon & { _id: string };

export async function makeLibraryDao(dbUrl: string) {
    return await LibraryDao.make(dbUrl);
}

//options for new MongoClient()
const MONGO_OPTIONS = {
    ignoreUndefined: true, //ignore undefined fields in queries
};

export class LibraryDao {
    //called by below static make() factory function with
    //parameters to be cached in this instance.
    constructor(
        private readonly client: mongo.MongoClient,
        private readonly books: mongo.Collection<DbBook>,
        private readonly patreons: mongo.Collection<DbPatreon>
    ) {}

    //static factory function; should do all async operations like
    //getting a connection and creating indexing.  Finally, it
    //should use the constructor to return an instance of this class.
    //returns error code DB on database errors.
    static async make(dbUrl: string): Promise<Errors.Result<LibraryDao>> {
        try {
            const client = await new mongo.MongoClient(
                dbUrl,
                MONGO_OPTIONS
            ).connect();
            const db = client.db();
            const books = db.collection<DbBook>(BOOKS_COLLECTION);
            const patreons = db.collection<DbPatreon>(PATREONS_COLLECTION);
            await books.createIndex("title");
            await books.createIndex("isbn");
            await books.createIndex("authors");
            return Errors.okResult(new LibraryDao(client, books, patreons));
        } catch (error) {
            return Errors.errResult(error.message, "DB");
        }
    }

    /** close off this DAO; implementing object is invalid after
     *  call to close()
     *
     *  Error Codes:
     *    DB: a database error was encountered.
     */
    async close(): Promise<Errors.Result<void>> {
        return Errors.errResult("TODO");
    }

    //add methods as per your API
} //class LibDao
const BOOKS_COLLECTION = "books";
const PATREONS_COLLECTION = "patreons";
