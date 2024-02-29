import { Errors } from "cs544-js-utils";
import { LibraryDao } from "./library-dao.js";
import * as Lib from "./library.js";
import { validate } from "./library.js";
import { boolean } from "zod";
/** Note that errors are documented using the `code` option which must be
 *  returned (the `message` can be any suitable string which describes
 *  the error as specifically as possible).  Whenever possible, the
 *  error should also contain a `widget` option specifying the widget
 *  responsible for the error).
 *
 *  Note also that the underlying DAO should not normally require a
 *  sequential scan over all books or patrons.
 */

/************************ Main Implementation **************************/

export function makeLendingLibrary(dao: LibraryDao) {
    return new LendingLibrary(dao);
}

export class LendingLibrary {
    constructor(private readonly dao: LibraryDao) {}

    /** clear out underlying db */
    async clear(): Promise<Errors.Result<void>> {
        return this.dao.clear();
    }

    /** Add one-or-more copies of book represented by req to this library.
     *  If the book is already in the library and consistent with the book
     *  being added, then the nCopies of the book is simply updated by
     *  the nCopies of the object being added (default 1).
     *
     *  Errors:
     *    MISSING: one-or-more of the required fields is missing.
     *    BAD_TYPE: one-or-more fields have the incorrect type.
     *    BAD_REQ: other issues, like:
     *      "nCopies" or "pages" not a positive integer.
     *      "year" is not integer in range [1448, currentYear]
     *      "isbn" is not in ISBN-10 format of the form ddd-ddd-ddd-d
     *      "title" or "publisher" field is empty.
     *      "authors" array is empty or contains an empty author
     *      book is already in library but data in req is
     *      inconsistent with the data already present.
     */
    async addBook(req: Record<string, any>): Promise<Errors.Result<Lib.XBook>> {
        const errors: Errors.Err[] = [];
        const bookResult: Errors.Result<Lib.XBook> = validate("addBook", req);
        if (!bookResult.isOk) {
            return Errors.errResult(bookResult);
        }
        //TODO: Add the code to use Dao and add the book to database
        let { isbn, title, authors, pages, year, publisher, nCopies } = req;
        if (!nCopies) {
            nCopies = 1;
        }
        const findResult = await this.dao.findByISBN(isbn);
        if (findResult.isOk) {
            const {
                title: uTitle,
                authors: uAuthors,
                pages: uPages,
                year: uYear,
                publisher: uPublisher,
            } = findResult.val;
            if (
                title === uTitle &&
                arraysEqual(authors, uAuthors) &&
                pages === uPages &&
                year === uYear &&
                publisher === uPublisher
            ) {
                this.dao.updateBookCopies(findResult.val._id);
            } else {
                const msg: string =
                    "Data entered is inconsistent with the existing data in the library";
                const code: string = "BAD_REQ";
                const widget: string = "inconsistent";
                errors.push(new Errors.Err(msg, { code, widget }));
                return new Errors.ErrResult(errors);
            }
        }
        const newBook = await this.dao.addBook({
            isbn,
            title,
            authors,
            pages,
            year,
            publisher,
            nCopies,
        });
        if (newBook.isOk) {
            return Errors.okResult(newBook.val);
        } else {
            const msg: string = "Some unexpected error occurred";
            const code: string = "UNEXPECTED_ERROR";
            const widget: string = "BOOK";
            errors.push(new Errors.Err(msg, { code, widget }));
            return new Errors.ErrResult(errors);
        }
    }

    /** Return all books whose authors and title fields contain all
     *  "words" in req.search, where a "word" is a max sequence of /\w/
     *  of length > 1.  Note that word matching must be case-insensitive,
     *  but can depend on any stemming rules of the underlying database.
     *
     *  The req can optionally contain non-negative integer fields
     *  index (default 0) and count (default DEFAULT_COUNT).  The
     *  returned results are a slice of the sorted results from
     *  [index, index + count).  Note that this slicing *must* be
     *  performed by the database.
     *
     *  Returned books should be sorted in ascending order by title.
     *  If no books match the search criteria, then [] should be returned.
     *
     *  Errors:
     *    MISSING: search field is missing
     *    BAD_TYPE: search field is not a string or index/count are not numbers.
     *    BAD_REQ: no words in search, index/count not int or negative.
     */
    async findBooks(
        req: Record<string, any>
    ): Promise<Errors.Result<Lib.XBook[]>> {
        const findResult: Errors.Result<Lib.XBook> = validate("findBooks", req);
        if (!findResult.isOk) {
            return Errors.errResult(findResult);
        }

        const searchQuery = req.search ? req.search.trim().toLowerCase() : "";
        const words: string[] = searchQuery
            .split(/\W+/)
            .filter((word: string) => word.length > 1);

        const processedSearchQuery: string = words
            .map((word) => `"${word}"`)
            .join(" ");
        const res: Errors.Result<Lib.Book[]> = await this.dao.findBooks(
            processedSearchQuery,
            req.index,
            req.count
        );
        return res;
    }

    /** Set up patron req.patronId to check out book req.isbn.
     *
     *  Errors:
     *    MISSING: patronId or isbn field is missing
     *    BAD_TYPE: patronId or isbn field is not a string.
     *    BAD_REQ: invalid isbn or error on business rule violation, like:
     *      isbn does not specify a book in the library
     *      no copies of the book are available for checkout
     *      patron already has a copy of the same book checked out
     */
    async checkoutBook(req: Record<string, any>): Promise<Errors.Result<void>> {
        const missingErrors: Errors.Result<Lib.XBook> = validate(
            "checkoutBook",
            req
        );
        if (!missingErrors.isOk) {
            return Errors.errResult(missingErrors);
        }
        const { patronId, isbn } = req;
        const isValidBook = await this.dao.findByISBN(isbn);
        if (!isValidBook.isOk) {
            return Errors.errResult("The isbn provided is incorrect", {
                code: "BAD_REQ",
            });
        }
        const isValidCheckout: boolean = await this.dao.validateCheckoutRequest(
            isbn,
            patronId
        );
        if (isValidCheckout) {
            await this.dao.updateTracker(isbn, patronId);
            return Errors.VOID_RESULT;
        }

        return Errors.errResult("TODO");
    }

    /** Set up patron req.patronId to returns book req.isbn.
     *
     *  Errors:
     *    MISSING: patronId or isbn field is missing
     *    BAD_TYPE: patronId or isbn field is not a string.
     *    BAD_REQ: invalid isbn or error on business rule violation like
     *    isbn does not specify a book in the library or there is
     *    no checkout of the book by patronId.
     */
    async returnBook(req: Record<string, any>): Promise<Errors.Result<void>> {
        const missingErrors: Errors.Result<Lib.XBook> = validate(
            "checkoutBook",
            req
        );
        if (!missingErrors.isOk) {
            return Errors.errResult(missingErrors);
        }
        const { patronId, isbn } = req;
        const isValidReturn: boolean = await this.dao.validateReturn(
            isbn,
            patronId
        );
        if (!isValidReturn) {
            return Errors.errResult("Invalid return!", { code: "BAD_REQ" });
        }
        const data = await this.dao.deleteRecord(isbn, patronId);
        if (data.isOk) {
            return Errors.VOID_RESULT;
        }
        return Errors.errResult("Some error occured!", { code: "BAD_REQ" });
    }

    //add class code as needed
}

// default count for find requests
const DEFAULT_COUNT = 5;

//add file level code as needed

/********************** Domain Utility Functions ***********************/

/** return a field where book0 and book1 differ; return undefined if
 *  there is no such field.
 */
function compareBook(book0: Lib.Book, book1: Lib.Book): string | undefined {
    if (book0.title !== book1.title) return "title";
    if (book0.authors.some((a, i) => a !== book1.authors[i])) return "authors";
    if (book0.pages !== book1.pages) return "pages";
    if (book0.year !== book1.year) return "year";
    if (book0.publisher !== book1.publisher) return "publisher";
}

//TODO: Utility function to check equality of arrays
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
