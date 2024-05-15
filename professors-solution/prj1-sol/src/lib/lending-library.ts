import { Errors } from 'cs544-js-utils';

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
  pages: number;      //must be int > 0
  year: number;       //must be int > 0
  publisher: string;
  nCopies?: number;   //# of copies owned by library; not affected by borrows;
                      //must be int > 0; defaults to 1
}; 

export type XBook = Required<Book>;

type AddBookReq = Book;
type FindBooksReq = { search: string; };
type ReturnBookReq = { patronId: PatronId; isbn: ISBN; };
type CheckoutBookReq = { patronId: PatronId; isbn: ISBN; };

/************************ Main Implementation **************************/

export function makeLendingLibrary() {
  return new LendingLibrary();
}

export class LendingLibrary {

  private books: Record<ISBN, XBook>;
  private wordIsbns: Record<string, ISBN[]>;
  private patronCheckouts: Record<PatronId, ISBN[]>;
  private bookCheckouts: Record<ISBN, PatronId[]>;
  
  constructor() {
    this.books = {};
    this.wordIsbns = {};
    this.patronCheckouts = {};
    this.bookCheckouts = {};
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
    const bookResult = validateBook(req);
    if (!bookResult.isOk) return bookResult;
    const book = bookResult.val;
    const isbn = book.isbn;
    const book0 = this.books[isbn];
    if (book0) {
      const badField = compareBook(book0, book);
      if (badField) {
	const msg = `inconsistent ${badField} data for book ${isbn}`;
	return Errors.errResult(msg, { code: 'BAD_REQ', widget: badField });
      }
      this.books[isbn].nCopies += book.nCopies;
      return Errors.okResult(this.books[isbn]);
    }
    this.books[isbn] = book;
    for (const w of splitWords(book.title + ' ' + book.authors.join(' '))) {
      this.wordIsbns[w] ??= [];
      this.wordIsbns[w].push(isbn);
    }
    return Errors.okResult(book);
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
  findBooks(req: Record<string, any>) : Errors.Result<XBook[]> {
    const chkResult: Errors.Result<FindBooksReq> =
      chkStringProps(req, [ 'search' ]);
    if (!chkResult.isOk) return chkResult;
    const { search } = chkResult.val;
    const words = [...splitWords(search)];
    if (words.length === 0) {
      const msg = 'no words in search';
      return Errors.errResult(msg, { code: 'BAD_REQ', widget: 'search' });
    }
    let isbns = new Set(this.wordIsbns[words.shift()!] ?? []);
    for (const w of words) {
      const wIsbns = this.wordIsbns[w] ?? [];
      const isbns1 = new Set<string>();
      for (const isbn of wIsbns) {
	if (isbns.has(isbn)) isbns1.add(isbn);
      }
      isbns = isbns1;
    }
    const books: XBook[] = [];
    for (const isbn of isbns) {
      const book = this.books[isbn];
      console.assert(book, `no book for ${isbn}`);
      books.push(book);
    }
    const sorted = books.toSorted((a, b) => a.title.localeCompare(b.title));
    return Errors.okResult(sorted);
  }


  /** Set up patron req.patronId to check out book req.isbn. 
   * 
   *  Errors:
   *    MISSING: patronId or isbn field is missing
   *    BAD_TYPE: patronId or isbn field is not a string.
   *    BAD_REQ error on business rule violation.
   */
  checkoutBook(req: Record<string, any>) : Errors.Result<void> {
    const chkResult: Errors.Result<CheckoutBookReq> =
      chkStringProps(req, [ 'patronId', 'isbn' ]);
    if (!chkResult.isOk) return chkResult;
    const { patronId, isbn } = chkResult.val;
    if (!this.books[isbn]) {
      const msg = `unknown book ${isbn}`;
      return Errors.errResult(msg, { code: 'BAD_REQ', widget: 'isbn' });
    }
    if ((this.patronCheckouts[patronId] ?? []).includes(isbn)) {
      const msg = `patron ${patronId} already has book ${isbn} checked out`;
      return Errors.errResult(msg, { code: 'BAD_REQ', widget: 'isbn' });
    }
    if ((this.bookCheckouts[isbn] ?? []).length >= this.books[isbn].nCopies) {
      const msg = `no copies of book ${isbn} are available for checkout`;
      return Errors.errResult(msg, { code: 'BAD_REQ', widget: 'isbn' });
    }
    this.patronCheckouts[patronId] ??= [];
    this.patronCheckouts[patronId].push(isbn);
    this.bookCheckouts[isbn] ??= [];
    this.bookCheckouts[isbn].push(patronId);
    return Errors.VOID_RESULT;
  }

  /** Set up patron req.patronId to returns book req.isbn.
   *  
   *  Errors:
   *    MISSING: patronId or isbn field is missing
   *    BAD_TYPE: patronId or isbn field is not a string.
   *    BAD_REQ error on business rule violation.
   */
  returnBook(req: Record<string, any>) : Errors.Result<void> {
    const chkResult: Errors.Result<ReturnBookReq> = 
      chkStringProps(req, [ 'patronId', 'isbn' ]);
    if (!chkResult.isOk) return chkResult;
    const { patronId, isbn } = chkResult.val;
    const bookCheckouts = this.bookCheckouts[isbn];
    if (!(bookCheckouts ?? []).includes(patronId)) {
      const msg = `no checkout of book ${isbn} by patron ${patronId}`;
      return Errors.errResult(msg, { code: 'BAD_REQ', widget: 'isbn' });
    }
    const patronCheckouts = this.patronCheckouts[patronId];
    console.assert((patronCheckouts ?? []).includes(isbn));
    patronCheckouts.splice(patronCheckouts.indexOf(isbn), 1);
    if (patronCheckouts.length === 0) delete this.patronCheckouts[patronId];
    bookCheckouts.splice(bookCheckouts.indexOf(patronId), 1);
    if (bookCheckouts.length === 0) delete this.bookCheckouts[isbn];
    return Errors.VOID_RESULT;
  }
  
}


/********************** Domain Utility Functions ***********************/

function chkStringProps<T>(obj: Record<string, any>, props: string[])
  : Errors.Result<T>
{
  const errors: Errors.Err[] = [];
  for (const p of props) {
    if (obj[p] === undefined) {
      const msg = `property ${p} is required`;
      errors.push(new Errors.Err(msg, { code: 'MISSING', widget: p }));
    }
    else if (typeof obj[p] !== 'string') {
      const msg = `property ${p} must be a string`;
      errors.push(new Errors.Err(msg, { code: 'BAD_TYPE', widget: p}));
    }
  }
  return (errors.length > 0)
    ? new Errors.ErrResult(errors)
    : Errors.okResult({...obj} as T);
}

function compareBook(book0: Book, book1: Book) : string|undefined {
  if (book0.title !== book1.title) return 'title';
  if (book0.authors.some((a, i) => a !== book1.authors[i])) return 'authors';
  if (book0.pages !== book1.pages) return 'pages';
  if (book0.year !== book1.year) return 'year';
  if (book0.publisher !== book1.publisher) return 'publisher';
}

const MIN_BOOK_DATA = {
  title: '', authors: [ '' ], isbn: '', pages: 1, year: 1, publisher: '',
  nCopies: 1,
};

function validateBook(req: Record<string, any>) : Errors.Result<XBook> {
  const errors: Errors.Err[] = [];
  const obj: Record<string, any> = { nCopies: MIN_BOOK_DATA.nCopies, ...req };
  for (const [widget, value] of Object.entries(MIN_BOOK_DATA)) {
    const widgetValue = obj[widget];
    if (widgetValue === undefined) {
      const msg = `property ${widget} is required`;
      errors.push(new Errors.Err(msg, { code: 'MISSING', widget}));
    }
    else if (typeof widgetValue !== typeof value) {
      const expectedType = widget === 'authors' ? 'string[]' : typeof value;
      const msg = `${widget} must have type ${expectedType}`;
      errors.push(new Errors.Err(msg, { code: 'BAD_TYPE', widget}));
    }
    else if (typeof value === 'number' &&
            (!Number.isInteger(widgetValue) || widgetValue <= 0)) {
      const msg = `${widget} must be a positive integer`;
      errors.push(new Errors.Err(msg, { code: 'BAD_REQ', widget}));
    }
    else if (widget === 'authors' &&
             (!Array.isArray(widgetValue) || widgetValue.length === 0 ||
	       widgetValue.some(a => typeof a !== 'string'))) {
      const msg = `authors must have type string[]`;
      errors.push(new Errors.Err(msg, { code: 'BAD_TYPE',
					widget: 'authors'}));
    }
  }
  return (errors.length > 0) 
    ? new Errors.ErrResult(errors)
    : Errors.okResult(obj as XBook);
}

/********************* General Utility Functions ***********************/

/** pull out search words from text */
function splitWords(text: string) : Set<string> {
  const words = text.split(/\W+/)
    .filter(w => w.length > 1)
    .map(w => w.toLowerCase());
  return new Set(words);	      
}

