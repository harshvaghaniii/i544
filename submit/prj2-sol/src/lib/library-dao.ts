import * as mongo from "mongodb";

import { Errors } from "cs544-js-utils";

import * as Lib from "./library.js";
import { text } from "stream/consumers";

//TODO: define any DB specific types if necessary
type DbBook = Lib.XBook;
type DbPatreon = Lib.Patreon;

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
            await books.createIndex({ title: "text", authors: "text" });
            return Errors.okResult(new LibraryDao(client, books, patreons));
        } catch (error) {
            return Errors.errResult(error.message, "DB");
        }
    }

    /**
     * Asynchronous function to add a Book
     */

    async add(book: Lib.Book): Promise<Errors.Result<Lib.Book>> {
        const registeredBook: Lib.Book = { ...book };
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

    async findByISBN(isbn: string): Promise<Errors.Result<Lib.Book>> {
        try {
            const collection = this.books;
            const book = await collection.findOne({ isbn });
            if (book) {
                return Errors.okResult(book);
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
        bookID: mongo.ObjectId,
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

    //add methods as per your API
} //class LibDao
const BOOKS_COLLECTION = "books";
const PATREONS_COLLECTION = "patreons";
