import { LendingLibrary, makeLendingLibrary } from '../lib/lending-library.js';

import { BOOKS, LANG_BOOKS, BOOK_nCopies2, BOOK_nCopies1 }
  from './data/data.js';

import { assert, expect } from 'chai';

//use assert(result.isOk === true) and assert(result.isOk === false)
//to ensure that typescript narrows result correctly


describe('lending library extra tests', () => {

  let library: LendingLibrary;

  beforeEach(() => {
    library = makeLendingLibrary();
  });

  describe('addBook()', () => {

    const NUMERIC_FIELDS = [ 'pages', 'year', 'nCopies' ];


    it('must catch numeric field <= 0', () => {
      for (const [i, book] of BOOKS.entries()) {
	for (const [j, field] of NUMERIC_FIELDS.entries()) {
	  const book1 = { ...book, [field]: -i - j };
	  const bookResult = library.addBook(book1);
	  assert(bookResult.isOk === false);
	  // expect(bookResult.errors).to.have.length(1);
	  // expect(bookResult.errors[0].options.code).to.equal('BAD_REQ');
	  // expect(bookResult.errors[0].options.widget).to.equal(field);
	}
      }
    });

    it('must catch non-integer numeric field', () => {
      for (const book of BOOKS) {
	for (const [i, field] of NUMERIC_FIELDS.entries()) {
	  const book1 = { ...book, [field]: i + 0.001 };
	  const bookResult = library.addBook(book1);
	  assert(bookResult.isOk === false);
	  // expect(bookResult.errors).to.have.length(1);
	  // expect(bookResult.errors[0].options.code).to.equal('BAD_REQ');
	  // expect(bookResult.errors[0].options.widget).to.equal(field);
	}
      }
    });
    
  });  //describe('addBooks()', ...)


  describe('findBooks()', () => {

    beforeEach(() => {
      for (const book of BOOKS) {
	const bookResult = library.addBook(book);
	assert(bookResult.isOk === true);
      }
    });

    
  });

  describe('checkoutBook()', () => {

    beforeEach(() => {
      for (const book of BOOKS) {
	const bookResult = library.addBook(book);
	assert(bookResult.isOk === true);
      }
    });


  });

  describe('checkout and return books', () => {

    beforeEach(() => {
      for (const book of BOOKS) {
	const bookResult = library.addBook(book);
	assert(bookResult.isOk === true);
      }
    });

  });

});

const PATRONS = [ 'joe', 'sue', 'ann' ];

