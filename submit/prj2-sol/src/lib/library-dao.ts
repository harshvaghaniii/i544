import * as mongo from "mongodb";

import { Errors } from "cs544-js-utils";

import * as Lib from "./library.js";
import { text } from "stream/consumers";

//TODO: define any DB specific types if necessary
type DbBook = Lib.XBook & { _id: string };
type NextId = { _id: string; count: number };
type DbTracker = Lib.Lend;

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
        private readonly tracker: mongo.Collection<DbTracker>,
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
            const tracker = db.collection<DbTracker>(PATREONS_COLLECTION);
            const nextId = db.collection<NextId>(NEXT_ID_COLLECTION);
            await books.createIndex({
                title: "text",
                authors: "text",
            });
            await books.createIndex("isbn");
            return Errors.okResult(
                new LibraryDao(client, books, tracker, nextId)
            );
        } catch (error) {
            return Errors.errResult(error.message, "DB");
        }
    }

    /**
     * Asynchronous function to add a Book
     */

    async addBook(book: Lib.XBook): Promise<Errors.Result<DbBook>> {
        const bookID = await this.#nextBookID();
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
     */

    async updateBookCopies(
        bookID: string,
        nCopies: number
    ): Promise<Errors.Result<DbBook>> {
        const collection = this.books;
        try {
            const modifiedBook = await collection.findOneAndUpdate(
                { _id: bookID },
                { $inc: { nCopies: nCopies } },
                { returnDocument: "after" }
            );
            if (modifiedBook) {
                return Errors.okResult(modifiedBook);
            } else {
                return Errors.errResult(`Book with '${bookID} not found!'`, {
                    code: "NOT_FOUND",
                });
            }
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

    /**
     * Async function that returns all the books of a given isbn
     */

    async validateCheckoutRequest(
        isbn: string,
        patronID: string
    ): Promise<boolean> {
        const collection = this.tracker;
        try {
            const bookCursor = await collection.find({ isbn }).toArray();
            if (!bookCursor) return true;
            const patronCursor = await collection.find({ isbn }).toArray();
            const book: Errors.Result<DbBook> = await this.findByISBN(isbn);
            let nCopies: number;
            if (book.isOk) {
                nCopies = book.val.nCopies;
            }
            if (nCopies === bookCursor.length) {
                return false;
            }
            const isPatreonPresent = bookCursor.some(
                (obj) => obj.patronId == patronID
            );
            if (isPatreonPresent) return false;
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Async function that will validate return request
     */

    async validateReturn(isbn: string, patronID: string): Promise<boolean> {
        const collection = this.tracker;
        try {
            const record = await collection.findOne({
                isbn: isbn,
                patronId: patronID,
            });
            if (!record) {
                return false;
            }
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Async function to delete an information from tracker
     */

    async deleteRecord(
        isbn: string,
        patronID: string
    ): Promise<Errors.Result<void>> {
        const collection = this.tracker;
        try {
            await collection.findOneAndDelete({ isbn, patronId: patronID });
            return Errors.VOID_RESULT;
        } catch (error) {
            return Errors.errResult("Some error occurred", { code: "BAD_REQ" });
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
            await this.tracker.deleteMany({});
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

    /**
     * Async function to add the transaction to trackers
     */

    async updateTracker(
        isbn: string,
        patreonID: string
    ): Promise<Errors.Result<void>> {
        try {
            const collection = this.tracker;
            await collection.insertOne({ isbn, patronId: patreonID });
            return Errors.VOID_RESULT;
        } catch (error) {
            return Errors.errResult(error.message, { code: "DB" });
        }
    }

    async #nextBookID(): Promise<string> {
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
