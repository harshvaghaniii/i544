import * as mongo from "mongodb";

import { Errors } from "cs544-js-utils";

import * as Lib from "./library.js";
import { text } from "stream/consumers";

//TODO: define any DB specific types if necessary
type DbBook = Lib.XBook & { _id: string };
type DbPatreon = Lib.Patreon;
type NextId = { _id: string; count: number };

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
        private readonly patreons: mongo.Collection<DbPatreon>,
        private readonly nextId: mongo.Collection<NextId>
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
            const nextId = db.collection<NextId>(NEXT_ID_COLLECTION);
            await books.createIndex({
                title: "text",
                authors: "text",
            });
            await books.createIndex("isbn");
            return Errors.okResult(
                new LibraryDao(client, books, patreons, nextId)
            );
        } catch (error) {
            return Errors.errResult(error.message, "DB");
        }
    }

    /**
     * Asynchronous function to add a Book
     */

    async addBook(book: Lib.XBook): Promise<Errors.Result<DbBook>> {
        const bookID = await this.#nextUserId();
        const registeredBook: DbBook = { _id: bookID, ...book };
        const dbObj = { ...registeredBook };
        try {
            const collection = this.books;
            await collection.insertOne(dbObj);
        } catch (e) {
            return Errors.errResult(e.message, "DB");
        }
        return Errors.okResult(registeredBook);
    }

    /**
     * Async method to find the book using isbn
     */

    async findByISBN(isbn: string): Promise<Errors.Result<DbBook>> {
        try {
            const collection = this.books;
            const book = await collection.findOne({ isbn });
            if (book) {
                return Errors.okResult(book);
            } else {
                return Errors.errResult(`Book with ${isbn} not found!!,`, {
                    code: "NOT_FOUND",
                });
            }
        } catch (error) {
            return Errors.errResult(`Book with '${isbn}' not found!!`, {
                code: "NOT_FOUND",
            });
        }
    }

    /**
     * async function to increase the number of ncopies of a book
     * If count = 1, increment copies
     * If count = -1, decrement copies
     */

    async updateBookCopies(
        bookID: string,
        count: number
    ): Promise<Errors.Result<Lib.Book>> {
        const collection = this.books;
        try {
            const modifiedBook = await collection.updateOne(
                { _id: bookID },
                { $inc: { nCopies: count } }
            );
            return Errors.okResult(modifiedBook) as Errors.Result<Lib.Book>;
        } catch (error) {
            return Errors.errResult(`Book with '${bookID} not found!'`, {
                code: "NOT_FOUND",
            });
        }
    }

    /**
     * Async function that will be used to findBooks based on the preprocessed search string
     */

    async findBooks(
        query: string,
        index?: number,
        count?: number
    ): Promise<Errors.Result<Lib.XBook[]>> {
        const collection = this.books;
        const projection = { _id: false };
        try {
            const formattedSearchQuery = `'${query}'`;
            const searchSpec = {
                $text: {
                    $search: formattedSearchQuery,
                },
            };
            let cursor = collection
                .find(searchSpec, { projection })
                .sort({ title: 1 });
            let result: Lib.XBook[];
            if (index !== undefined && count !== undefined) {
                // Slice the cursor before converting it to array
                const slicedCursor = cursor.skip(index).limit(count);
                result = await slicedCursor.toArray();
            } else {
                // If index and count are not provided, convert the cursor to array directly
                result = await cursor.toArray();
            }
            return Errors.okResult(result);
        } catch (error) {
            return Errors.errResult("Invalid search query", {
                code: "INVALID",
            });
        }
    }

    /** clear all data in this DAO.
     *
     *  Error Codes:
     *    DB: a database error was encountered.
     */
    async clear(): Promise<Errors.Result<void>> {
        try {
            await this.books.deleteMany({});
            await this.patreons.deleteMany({});
            return Errors.VOID_RESULT;
        } catch (e) {
            return Errors.errResult(e.message, "DB");
        }
    }

    /** close off this DAO; implementing object is invalid after
     *  call to close()
     *
     *  Error Codes:
     *    DB: a database error was encountered.
     */
    async close(): Promise<Errors.Result<void>> {
        try {
            await this.client.close();
            return Errors.VOID_RESULT;
        } catch (e) {
            return Errors.errResult(e.message, "DB");
        }
    }

    async #nextUserId(): Promise<string> {
        const query = { _id: NEXT_ID_KEY };
        const update = { $inc: { [NEXT_ID_KEY]: 1 } };
        const options = {
            upsert: true,
            returnDocument: mongo.ReturnDocument.AFTER,
        };
        const ret = await this.nextId.findOneAndUpdate(query, update, options);
        const seq = ret[NEXT_ID_KEY];
        return (
            String(seq) + Math.random().toFixed(RAND_LEN).replace(/^0\./, "_")
        );
    }
    //add methods as per your API
} //class LibDao
const BOOKS_COLLECTION = "books";
const PATREONS_COLLECTION = "patreons";
const DEFAULT_COUNT = 5;

const NEXT_ID_COLLECTION = "nextId";
const NEXT_ID_KEY = "count";
const RAND_LEN = 2;
