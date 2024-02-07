import { Errors } from "cs544-js-utils";

/** Note that errors are documented using the `code` option which must be
 *  returned (the `message` can be any suitable string which describes
 *  the error as specifically as possible).  Whenever possible, the
 *  error should also contain a `widget` option specifying the widget
 *  responsible for the error).
 *
 *  Note also that none of the function implementations should normally
 *  require a sequential scan over all books or patrons.
 */

/******************** Types for Validated Requests *********************/

/** used as an ID for a book */
type ISBN = string;

/** used as an ID for a library patron */
type PatronId = string;

export type Book = {
    isbn: ISBN;
    title: string;
    authors: string[];
    pages: number; //must be int > 0
    year: number; //must be int > 0
    publisher: string;
    nCopies?: number; //# of copies owned by library; not affected by borrows;
    //must be int > 0; defaults to 1
};

export type XBook = Required<Book>;

type AddBookReq = Book;
type FindBooksReq = { search: string };
type ReturnBookReq = { patronId: PatronId; isbn: ISBN };
type CheckoutBookReq = { patronId: PatronId; isbn: ISBN };

/************************ Main Implementation **************************/

export function makeLendingLibrary() {
    return new LendingLibrary();
}

export class LendingLibrary {
    //TODO: declare private TS properties for instance
    private bookMap: Record<ISBN, XBook>[];
    private searchMap: Record<string, ISBN[]>;
    private trackPatrons: Record<ISBN, PatronId[]>;
    private trackBooks: Record<PatronId, ISBN[]>;
    constructor() {
        //TODO: initialize private TS properties for instance
        this.bookMap = {};
        this.searchMap = {};
        this.trackPatrons = {};
        this.trackBooks = {};
    }

    /** Add one-or-more copies of book represented by req to this library.
     *
     *  Errors:
     *    MISSING: one-or-more of the required fields is missing.
     *    BAD_TYPE: one-or-more fields have the incorrect type.
     *    BAD_REQ: other issues like nCopies not a positive integer
     *             or book is already in library but data in obj is
     *             inconsistent with the data already present.
     */
    addBook(req: Record<string, any>): Errors.Result<XBook> {
        //TODO
        console.log("here");

        /**
         * Idea: You're getting a book in the form of req
         * Check if it is a valid book
         * If it is, add it to the bookMap
         * Or else, don't add it and return an error
         */
        if (missingRequiredFields(req)) {
            return Errors.errResult(
                "Missing: One or more required fields are missing!"
            );
        }
        if (isBadlyTyped(req)) {
            return Errors.errResult(
                "BAD_TYPE: one-or-more fields have the incorrect type."
            );
        }
        return Errors.errResult("TODO"); //placeholder
    }

    /** Return all books matching (case-insensitive) all "words" in
     *  req.search, where a "word" is a max sequence of /\w/ of length > 1.
     *  Returned books should be sorted in ascending order by title.
     *
     *  Errors:
     *    MISSING: search field is missing
     *    BAD_TYPE: search field is not a string.
     *    BAD_REQ: no words in search
     */
    findBooks(req: Record<string, any>): Errors.Result<XBook[]> {
        //TODO
        return Errors.errResult("TODO"); //placeholder
    }

    /** Set up patron req.patronId to check out book req.isbn.
     *
     *  Errors:
     *    MISSING: patronId or isbn field is missing
     *    BAD_TYPE: patronId or isbn field is not a string.
     *    BAD_REQ error on business rule violation.
     */
    checkoutBook(req: Record<string, any>): Errors.Result<void> {
        //TODO
        return Errors.errResult("TODO"); //placeholder
    }

    /** Set up patron req.patronId to returns book req.isbn.
     *
     *  Errors:
     *    MISSING: patronId or isbn field is missing
     *    BAD_TYPE: patronId or isbn field is not a string.
     *    BAD_REQ error on business rule violation.
     */
    returnBook(req: Record<string, any>): Errors.Result<void> {
        //TODO
        return Errors.errResult("TODO"); //placeholder
    }
}

/********************** Domain Utility Functions ***********************/

//TODO: add domain-specific utility functions or classes.

/********************* General Utility Functions ***********************/

//TODO: add general utility functions or classes.

const missingRequiredFields: (a: Record<string, any>) => boolean = (
    req: Record<string, any>
) => {
    if (
        !req ||
        !req.title ||
        !req.authors ||
        !req.isbn ||
        !req.pages ||
        !req.year ||
        !req.publisher
    ) {
        return true;
    }
    return false;
};

const isBadlyTyped: (req: Record<string, any>) => boolean = (
    req: Record<string, any>
) => {
    const { title, authors, isbn, pages, year, publisher } = req;
    if (typeof title !== "string" || typeof publisher !== "string") {
        return true;
    }
    if (
        !(
            Array.isArray(authors) &&
            authors.length > 0 &&
            authors.every((item) => typeof item === "string")
        )
    ) {
        return true;
    }
    if (typeof pages !== "number" || typeof year !== "number") {
        return true;
    }
    if (typeof isbn !== "string") {
        return true;
    }
    return false;
};
