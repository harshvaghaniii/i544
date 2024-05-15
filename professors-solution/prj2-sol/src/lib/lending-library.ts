import { Errors } from 'cs544-js-utils';

import { LibraryDao } from './library-dao.js';
import * as Lib from './library.js';

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

  constructor(private readonly dao: LibraryDao) {
  }

  /** clear out underlying db */
  async clear() : Promise<Errors.Result<void>> {
    return await this.dao.clear();
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
    const bookResult = Lib.validate<Lib.Book>('addBook', req);
    if (!bookResult.isOk) return bookResult;
    const xBook: Lib.XBook = { nCopies: 1, ...bookResult.val };
    const isbn = xBook.isbn;
    const book0Result = await this.dao.getBook(isbn);
    if (book0Result.isOk === true) {
      const book0 = book0Result.val;
      const badField = compareBook(book0, xBook);
      if (badField) {
	const msg = `inconsistent ${badField} data for book ${isbn}`;
	return Errors.errResult(msg, { code: 'BAD_REQ', widget: badField });
      }
      const nCopies1 = xBook.nCopies + book0.nCopies;
      const updateResult = await this.dao.updateBookNCopies(isbn, nCopies1);
      if (!updateResult.isOk) return updateResult as Errors.Result<Lib.XBook>;
      return Errors.okResult({...xBook, nCopies: nCopies1});
    }
    else if (book0Result.errors[0].options.code !== 'NOT_FOUND') {
      return book0Result;
    }
    else {
      const addResult = await this.dao.addBook(xBook);
      if (!addResult.isOk) return addResult;
      return Errors.okResult(xBook);
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
  async findBooks(req: Record<string, any>)
    : Promise<Errors.Result<Lib.XBook[]>>
  {
    const findResult = Lib.validate<Lib.Find>('findBooks', req);
    if (!findResult.isOk) return findResult as Errors.Result<Lib.XBook[]>;
    const xFind = { index: 0, count: DEFAULT_COUNT, ...findResult.val };

    //ensure mongo ands search words
    xFind.search = xFind.search.split(/\W+/).map(w => `"${w}"`).join(' ');
    return await this.dao.findBooks(xFind);
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
  async checkoutBook(req: Record<string, any>) : Promise<Errors.Result<void>> {
    const lendInfosResult = await this.getLendInfos('checkoutBook', req);
    if (!lendInfosResult.isOk) return lendInfosResult as Errors.Result<void>;
    const { isbn, patronId, book, isbnLends, patronLends }
      = lendInfosResult.val;

    if (isbnLends.length >= book.nCopies) {
      const msg = `no copies of book ${isbn} are available for checkout`;
      return Errors.errResult(msg, { code: 'BAD_REQ', widget: 'isbn' });
    }

    if (patronLends.find(lend => lend.isbn === isbn)) {
      const msg = `patron ${patronId} already has book ${isbn} checked out`;
      return Errors.errResult(msg, { code: 'BAD_REQ', widget: 'isbn' });
    }

    const addResult = await this.dao.addLend({isbn, patronId});
    return (addResult.isOk)
      ? Errors.VOID_RESULT
      : addResult as Errors.Result<void>;    
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
  async returnBook(req: Record<string, any>) : Promise<Errors.Result<void>> {
    const lendInfosResult = await this.getLendInfos('returnBook', req);
    if (lendInfosResult.isOk === false) {
      return lendInfosResult as Errors.Result<void>;
    }
    const { isbn, patronId, book, isbnLends, patronLends } =
      lendInfosResult.val;
    
    if (!patronLends.find(lend => lend.isbn === isbn)) {
      const msg = `no checkout of book ${isbn} by patron ${patronId}`;
      return Errors.errResult(msg, { code: 'BAD_REQ', widget: 'isbn' });
    }
    const removeResult = await this.dao.removeLend({isbn, patronId});
    return removeResult;
  }

  /** Common handling for checkoutBook() and returnBook()
   */
  private async getLendInfos(cmd: string, req: Record<string, any>)
    : Promise<Errors.Result<LendInfo>>
  {
    const lendResult = Lib.validate<Lib.Lend>(cmd, req);
    if (!lendResult.isOk) return lendResult as Errors.Result<LendInfo>;
    const { isbn, patronId } = lendResult.val;

    const bookResult = await this.dao.getBook(isbn);
    if (bookResult.isOk === false) {
      if (bookResult.errors[0].options.code !== 'NOT_FOUND') {
	return bookResult;
      }
      else {
	const msg = `unknown book ${isbn}`;
	return Errors.errResult(msg, { code: 'BAD_REQ', widget: 'isbn' });
      }
    }
    const book = bookResult.val;

    const isbnLendsResult = await this.dao.findAllLendsByIsbn(isbn);
    if (!isbnLendsResult.isOk) {
      return isbnLendsResult as Errors.Result<LendInfo>;
    }
    const isbnLends = isbnLendsResult.val;

    const patronLendsResult = await this.dao.findAllLendsByPatronId(patronId);
    if (patronLendsResult.isOk === false) {
      return patronLendsResult as Errors.Result<LendInfo>;
    }
    const patronLends = patronLendsResult.val;
    return Errors.okResult({isbn, patronId, book, isbnLends, patronLends});
  }
}

// default count for find requests
const DEFAULT_COUNT = 5;

type LendInfo = {
  isbn: string,
  patronId: string,
  book: Lib.XBook,
  isbnLends: Lib.Lend[],
  patronLends: Lib.Lend[],
};
  

/********************** Domain Utility Functions ***********************/

/** return a field where book0 and book1 differ; return undefined if
 *  there is no such field.
 */
function compareBook(book0: Lib.Book, book1: Lib.Book) : string|undefined {
  if (book0.title !== book1.title) return 'title';
  if (book0.authors.some((a, i) => a !== book1.authors[i])) return 'authors';
  if (book0.pages !== book1.pages) return 'pages';
  if (book0.year !== book1.year) return 'year';
  if (book0.publisher !== book1.publisher) return 'publisher';
}


