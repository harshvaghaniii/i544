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
            "isbn",
            "pages",
            "year",
            "publisher",
        ];

        const isbn: ISBN = req.isbn;
        const title: string = req.title;
        const authors: string[] = req.authors;
        const pages: number = req.pages;
        const year: number = req.year;
        const publisher: string = req.publisher;
        const nCopies: number = req.nCopies || 1;
        if (!isbn) {
            error.push("isbn");
        }
        if (!title) {
            error.push("title");
        }
        if (!authors) {
            const msg = "Authors is missing";
            errors.push(
                new Errors.Err(msg, { code: "MISSING", widget: "authors" })
            );
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

        // Returning missing type errors

        if (errors.length > 0) {
            return new Errors.ErrResult(errors);
        }

        // Checking for numeric fields

        if (isNaN(Number(year))) {
            const msg: string = `Property year must be numeric`;
            const widget: string = "year";
            errors.push(new Errors.Err(msg, { code: "BAD_TYPE", widget }));
        }
        if (isNaN(Number(pages))) {
            const msg: string = `Property pages must be numeric`;
            const widget: string = "pages";
            errors.push(new Errors.Err(msg, { code: "BAD_TYPE", widget }));
        }
        if (nCopies && isNaN(Number(nCopies))) {
            const msg: string = `Property nCopies must be numeric`;
            const widget: string = "nCopies";
            errors.push(new Errors.Err(msg, { code: "BAD_TYPE", widget }));
        }

        // Returning numeric type errors

        if (errors.length > 0) {
            return new Errors.ErrResult(errors);
        }

        // Checking if nCopies is an Integer field

        if (nCopies !== Math.floor(nCopies)) {
            const msg: string = `nCopies must be an integer field!`;
            const widget: string = "nCopies";
            errors.push(new Errors.Err(msg, { code: "BAD_REQ", widget }));
            return new Errors.ErrResult(errors);
        }

        // Checking for an empty author array

        if (authors.length == 0) {
            const msg: string = "Authors should not be empty";
            const widget: string = "authors";
            const code: string = "BAD_TYPE";
            errors.push(new Errors.Err(msg, { code, widget }));
            return new Errors.ErrResult(errors);
        }

        // Checking if Authors is an array field

        if (!Array.isArray(authors)) {
            const msg = "Authors must be an array of string";
            errors.push(
                new Errors.Err(msg, { code: "BAD_TYPE", widget: "authors" })
            );
            return new Errors.ErrResult(errors);
        }
        for (let author of authors) {
            if (typeof author !== "string") {
                const msg = "property author must be of type string";
                errors.push(
                    new Errors.Err(msg, { code: "BAD_TYPE", widget: "authors" })
                );
                return new Errors.ErrResult(errors);
            }
        }

        // Checking validation for string fields

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

        // Returning the errors for badly typed string types

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
        if ((req.nCopies && req.nCopies < 0) || req.nCopies == 0) {
            const msg = `nCopies must be positive`;
            const widget: string = "nCopies";
            errors.push(new Errors.Err(msg, { code: "BAD_REQ", widget }));
            return new Errors.ErrResult(errors);
        }

        // return Errors.errResult("TODO"); //placeholder
        if (error.length === 0) {
            const userBook: Record<ISBN, XBook> = {
                [isbn]: {
                    isbn,
                    title,
                    authors,
                    pages,
                    year,
                    publisher,
                    nCopies,
                },
            };
            const bookInMap: Required<Book> = this.bookMap[userBook[isbn].isbn];
            // console.log("This is the isbn: ", userBook[isbn].isbn);
            // console.log("Printing the bookmap: ", this.bookMap);

            // console.log("Here: ", this.bookMap[userBook[isbn].isbn]);

            if (bookInMap) {
                // console.log(
                //     "I'm here and this is bookMap: " +
                //         JSON.stringify(this.bookMap)
                // );
                /**
                 * TODO:
                 * Check the validations of the book since the book already exists in library. If passed, increment the count or else send an error.
                 */
                // Steps to follow after verifying that the entered book is valid
                /**
                 * Check if the book exists in library
                 * If yes, check if all the details entered here are the same as existing book
                 * If yes, increase the nCopies count
                 */
                const {
                    title: uTitle,
                    authors: uAuthors,
                    isbn: uIsbn,
                    pages: uPages,
                    year: uYear,
                    publisher: uPublisher,
                    nCopies: uNcopies,
                } = bookInMap;
                if (
                    title === uTitle &&
                    arraysEqual(authors, uAuthors) &&
                    pages === uPages &&
                    year === uYear &&
                    publisher === uPublisher
                ) {
                    console.log(
                        "Existing nCopies: ",
                        this.bookMap[isbn].nCopies
                    );
                    console.log("New nCopies: ", userBook[isbn].nCopies);

                    this.bookMap[isbn].nCopies += userBook[isbn].nCopies;
                } else {
                    const msg: string =
                        "Data entered is inconsistent with the existing data in the library";
                    const code: string = "BAD_REQ";
                    const widget: string = "inconsistent";
                    errors.push(new Errors.Err(msg, { code, widget }));
                    return new Errors.ErrResult(errors);
                }
            } else {
                /**
                 * TODO:
                 * If the book is being added in the library for the first time, add the data in the search map and then add it to the bookMap.
                 */
                const words: string[] = title
                    .split(/\W+/)
                    .filter((word) => word.length > 1);
                for (let author of authors) {
                    const temp: string[] = author
                        .split(/\W+/)
                        .filter((word) => word.length > 1);
                    words.push(...temp);
                }

                // TODO: Adding those words to the search map

                for (let word of words) {
                    if (this.searchMap.hasOwnProperty(word)) {
                        this.searchMap[word].push(isbn);
                    } else {
                        this.searchMap[word.toLowerCase()] = [isbn];
                    }
                }
                this.bookMap = {
                    ...this.bookMap,
                    [isbn]: {
                        isbn,
                        title,
                        authors,
                        pages,
                        year,
                        publisher,
                        nCopies,
                    },
                };
            }
            return Errors.okResult(this.bookMap[isbn]);
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

function arraysEqual<T>(array1: T[], array2: T[]): boolean {
    // Check if the arrays have the same length
    if (array1.length !== array2.length) {
        return false;
    }

    // Sort both arrays
    const sortedArray1 = array1.slice().sort();
    const sortedArray2 = array2.slice().sort();

    // Check each element of the sorted arrays
    for (let i = 0; i < sortedArray1.length; i++) {
        if (sortedArray1[i] !== sortedArray2[i]) {
            return false; // Elements at position i are different
        }
    }

    // All elements are the same
    return true;
}
