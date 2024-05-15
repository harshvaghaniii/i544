import * as mongo from 'mongodb';

import { Errors } from 'cs544-js-utils';

import * as Lib from './library.js';

type DbBook = Lib.XBook & { _id: string };
type DbLend = Lib.Lend;

export async function makeLibraryDao(dbUrl: string) {
  return await LibraryDao.make(dbUrl);
}

//options for new MongoClient()
const MONGO_OPTIONS = {
  ignoreUndefined: true,  //ignore undefined fields in queries
};


export class LibraryDao {

  //called by below static make() factory function with
  //parameters to be cached in this instance.
  constructor(private readonly client: mongo.MongoClient,
	      private readonly books: mongo.Collection<DbBook>,
	      private readonly lends: mongo.Collection<DbLend>) {
  }

  //static factory function; should do all async operations like
  //getting a connection and creating indexing.  Finally, it
  //should use the constructor to return an instance of this class.
  //returns error code DB on database errors.
  static async make(dbUrl: string) : Promise<Errors.Result<LibraryDao>> {
    try {
      const client =
	await (new mongo.MongoClient(dbUrl, MONGO_OPTIONS)).connect();
      const db = client.db();
      const books = db.collection<DbBook>(BOOKS_COLLECTION);
      const lends = db.collection<DbLend>(LENDINGS_COLLECTION);
      await books.createIndex({ title: 'text', authors: 'text', });
      await lends.createIndex('isbn');
      await lends.createIndex('patronId');
      return Errors.okResult(new LibraryDao(client, books, lends));
    }
    catch (error) {
      return Errors.errResult(error.message, 'DB');
    }
  }

  /** close off this DAO; implementing object is invalid after 
   *  call to close() 
   *
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  async close() : Promise<Errors.Result<void>> {
    try {
      await this.client.close();
      return Errors.VOID_RESULT;
    }
    catch (e) {
      return Errors.errResult(e.message, 'DB');
    }
  }

  /** add book.
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  async addBook(book: Lib.XBook)
    : Promise<Errors.Result<Lib.XBook>>
  {
    const dbObj = { ...book, _id: book.isbn, };
    try {
      const collection = this.books;
      await collection.insertOne(dbObj);
    }
    catch (e) {
      return Errors.errResult(e.message, 'DB');
    }
    return Errors.okResult(book);
  }

  /** retrieve book by isbn.
   *
   *  Error codes:
   *    NOT_FOUND: no book found for isbn
   *    DB: a database error.
   */
  async getBook(isbn: string)
    : Promise<Errors.Result<Lib.XBook>> 
  {
    try {
      const collection = this.books;
      const projection = { _id: false };
      const book = await collection.findOne({_id: isbn}, {projection});
      if (book) {
	return Errors.okResult(book);
      }
      else {
	return Errors.errResult(`no book for isbn '${isbn}'`,
				{ code: 'NOT_FOUND' });
      }
    }
    catch (e) {
      return Errors.errResult(e.message, 'DB');
    }
  }


  /** return list of all users which match filter.  It is not an error
   *  if no books match.
   *
   *  Error codes:
   *    DB: a database error.
   */
  async findBooks(filter: Lib.Find)
    : Promise<Errors.Result<Lib.XBook[]>>
  {
    try {
      const index: number = filter.index ?? 0;
      const count: number = filter.count ?? DEFAULT_COUNT;
      const collection = this.books;
      const q = { $text: { $search: filter.search } };
      const projection = { _id: false };
      const cursor = await collection.find(q, {projection});
      const entries = await cursor
        .sort({title: 1}).skip(index).limit(count).toArray();
      return Errors.okResult(entries);
    }
    catch (e) {
      return Errors.errResult(e.message, 'DB');
    }
  }

  async updateBookNCopies(isbn: string, nCopies: number)
    : Promise<Errors.Result<void>>
  {
    const collection = this.books;
    const updateOp = {$set: {nCopies}};
    const updateResult = await collection.updateOne({_id: isbn}, updateOp);
    return updateResult
      ? Errors.VOID_RESULT
      : Errors.errResult(`no book for ${isbn}`, {code: 'NOT_FOUND'});
  }


  /** add Lend.
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  async addLend(lend: Lib.Lend)
    : Promise<Errors.Result<Lib.Lend>>
  {
    const dbObj = { ...lend,  };
    try {
      const collection = this.lends;
      await collection.insertOne(dbObj);
    }
    catch (e) {
      return Errors.errResult(e.message, 'DB');
    }
    return Errors.okResult(lend);
  }
  
  /** remove Lend.
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  async removeLend(lend: Lib.Lend)
    : Promise<Errors.Result<void>>
  {
    const dbObj = { ...lend, };
    try {
      const collection = this.lends;
      const delResult = await collection.deleteOne(dbObj);
      if (!delResult || delResult.deletedCount === 0) {
	const msg = `no lend for {${lend.isbn}, ${lend.patronId}}`;
	return Errors.errResult(msg, { code: 'NOT_FOUND' });
      }
      if (delResult.deletedCount !== 1) {
	const msg = `expected 1 deletion; got ${delResult.deletedCount}`;
	return Errors.errResult(msg, 'DB');
      }
      else {
	return Errors.VOID_RESULT;
      }
    }
    catch (e) {
      return Errors.errResult(e.message, 'DB');
    }
    return Errors.VOID_RESULT;
  }
  
  async findAllLendsByIsbn(isbn: string)
    : Promise<Errors.Result<Lib.Lend[]>>
  {
    try {
      const collection = this.lends;
      const q = { isbn };
      const projection = { _id: false };
      const cursor = await collection.find(q, {projection});
      const entries = await cursor.sort({isbn: 1}).toArray();
      return Errors.okResult(entries);
    }
    catch (e) {
      return Errors.errResult(e.message, 'DB');
    }
  }

  async findAllLendsByPatronId(patronId: string)
    : Promise<Errors.Result<Lib.Lend[]>>
  {
    try {
      const collection = this.lends;
      const q = { patronId };
      const projection = { _id: false };
      const cursor = await collection.find(q, {projection});
      const entries = await cursor.sort({isbn: 1}).toArray();
      return Errors.okResult(entries);
    }
    catch (e) {
      return Errors.errResult(e.message, 'DB');
    }
  }

  /** clear all data in this DAO.
   *
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  async clear() : Promise<Errors.Result<void>> {
    try {
      await this.books.deleteMany({});
      await this.lends.deleteMany({});
      return Errors.VOID_RESULT;
    }
    catch (e) {
      return Errors.errResult(e.message, 'DB');
    }
  }
 

} //class LibDao

const BOOKS_COLLECTION = 'users';
const LENDINGS_COLLECTION = 'lendings';

const DEFAULT_COUNT = 5;

