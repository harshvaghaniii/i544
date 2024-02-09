import { error } from "console";
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
    private bookMap: Record<ISBN, XBook>;
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
        const errors: Errors.Err[] = [];
        const error: string[] = [];
        const widgets: string[] = [
            "title",
            "authors",
            "isbn",
            "pages",
            "year",
            "publisher",
        ];
        /**
         * Idea: You're getting a book in the form of req
         * Check if it is a valid book
         * If it is, add it to the bookMap
         * Or else, don't add it and return an error
         */

        let { isbn, title, authors, pages, year, publisher, nCopies } = req;
        if (!isbn) {
            error.push("isbn");
        }
        if (!title) {
            error.push("title");
        }
        if (!authors) {
            error.push("authors");
        }
        if (!pages) {
            error.push("pages");
        }
        if (!year) {
            error.push("year");
        }
        if (!publisher) {
            error.push("publisher");
        }
        for (let widget of widgets) {
            if (error.includes(widget)) {
                const msg = `${widget} is required`;
                errors.push(new Errors.Err(msg, { code: "MISSING", widget }));
            }
        }

        /**
         * Returning missing type errors
         */

        if (errors.length > 0) {
            return new Errors.ErrResult(errors);
        }
        if (isNaN(Number(year))) {
            const msg: string = `Property year must be numeric`;
            const widget: string = "year";
            errors.push(new Errors.Err(msg, { code: "BAD_TYPE", widget }));
            // return new Errors.ErrResult(errors);
        }
        if (isNaN(Number(pages))) {
            const msg: string = `Property pages must be numeric`;
            const widget: string = "pages";
            errors.push(new Errors.Err(msg, { code: "BAD_TYPE", widget }));
            // return new Errors.ErrResult(errors);
        }
        if (nCopies && isNaN(Number(nCopies))) {
            const msg: string = `Property nCopies must be numeric`;
            const widget: string = "nCopies";
            errors.push(new Errors.Err(msg, { code: "BAD_TYPE", widget }));
            // return new Errors.ErrResult(errors);
        }

        /**
         * Checking for numeric fields
         */

        if (errors.length > 0) {
            return new Errors.ErrResult(errors);
        }

        // Checking if nCopies is an Integer field

        if (nCopies && nCopies !== Math.floor(nCopies)) {
            const msg: string = `nCopies must be an integer field!`;
            const widget: string = "nCopies";
            errors.push(new Errors.Err(msg, { code: "BAD_REQ", widget }));
            return new Errors.ErrResult(errors);
        }

        // Checking if Authors is an array field

        if (
            typeof authors !== "function" &&
            typeof authors.length !== "number"
        ) {
            const msg: string = `authors must have type string[]`;
            const widget: string = "author";
            errors.push(new Errors.Err(msg, { code: "BAD_TYPE", widget }));
            return new Errors.ErrResult(errors);
        }

        if (authors.length === 0) {
            const msg: string = `authors must not be empty`;
            const widget: string = "author";
            errors.push(new Errors.Err(msg, { code: "BAD_TYPE", widget }));
            return new Errors.ErrResult(errors);
        }

        authors.every((author: any) => {
            if (typeof author !== "string") {
                const msg: string = "authors must of type string";
                const widget: string = "author";
                errors.push(new Errors.Err(msg, { code: "BAD_TYPE", widget }));
                return new Errors.ErrResult(errors);
            }
        });

        // if (errors.length > 0) {
        //     return new Errors.ErrResult(errors);
        // }

        /**
         * Checking validation for string fields
         */

        if (typeof title !== "string") {
            const msg: string = `Property title must be of type string`;
            const widget: string = "title";
            errors.push(new Errors.Err(msg, { code: "BAD_TYPE", widget }));
        }
        if (typeof publisher !== "string") {
            const msg: string = `Property publisher must be of type string`;
            const widget: string = "publisher";
            errors.push(new Errors.Err(msg, { code: "BAD_TYPE", widget }));
        }
        if (typeof isbn !== "string") {
            const msg: string = `Property isbn must be of type string`;
            const widget: string = "isbn";
            errors.push(new Errors.Err(msg, { code: "BAD_TYPE", widget }));
        }

        if (errors.length > 0) {
            return new Errors.ErrResult(errors);
        }

        if (nCopies && nCopies != Math.floor(nCopies)) {
            const msg: string = `property nCopies must be Integer`;
            const widget: string = "nCopies";
            errors.push(new Errors.Err(msg, { code: "BAD_TYPE", widget }));
            // return new Errors.ErrResult(errors);
        }
        if (errors.length > 0) {
            return new Errors.ErrResult(errors);
        }
        if (year != Math.floor(year)) {
            const msg: string = `property year must be Integer`;
            const widget: string = "year";
            errors.push(new Errors.Err(msg, { code: "BAD_TYPE", widget }));
        }
        if ((nCopies && nCopies < 0) || nCopies == 0) {
            const msg = `nCopies must be positive`;
            const widget: string = "nCopies";
            errors.push(new Errors.Err(msg, { code: "BAD_REQ", widget }));
            return new Errors.ErrResult(errors);
        }

        // return Errors.errResult("TODO"); //placeholder
        if (error.length === 0) {
            if (!nCopies) {
                nCopies = 1;
            }
            this.bookMap = {
                ...this.bookMap,
                isbn: {
                    isbn,
                    title,
                    authors,
                    pages,
                    year,
                    publisher,
                    nCopies,
                },
            };
            return Errors.okResult(this.bookMap.isbn);
        } else {
            return new Errors.ErrResult(errors);
        }
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

// const missingRequiredFields: (a: Record<string, any>) => boolean = (
//     req: Record<string, any>
// ) => {
//     if (
//         !req ||
//         !req.title ||
//         !req.authors ||
//         !req.isbn ||
//         !req.pages ||
//         !req.year ||
//         !req.publisher
//     ) {
//         return true;
//     }
//     return false;
// };

// const isBadlyTyped: (req: Record<string, any>) => boolean = (
//     req: Record<string, any>
// ) => {
//     const { title, authors, isbn, pages, year, publisher } = req;
//     if (typeof title !== "string" || typeof publisher !== "string") {
//         return true;
//     }
//     if (
//         !(
//             Array.isArray(authors) &&
//             authors.length > 0 &&
//             authors.every((item: any) => typeof item === "string")
//         )
//     ) {
//         return true;
//     }
//     if (typeof pages !== "number" || typeof year !== "number") {
//         return true;
//     }
//     if (typeof isbn !== "string") {
//         return true;
//     }
//     return false;
// };
