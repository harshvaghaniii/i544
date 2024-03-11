//will run the project DAO using an in-memory mongodb server
import { MemDao, makeMemDao } from "./mem-dao.js";

import { LibraryDao } from "../lib/library-dao.js";

import * as Lib from "../lib/library.js";

import { BOOKS } from "./test-data.js";

import { assert, expect } from "chai";

describe("library DAO", () => {
    //mocha will run beforeEach() before each test to set up these variables
    let memDao: MemDao;
    let dao: LibraryDao;
    let dbUrl = "mongodb://localhost:27017/";
    beforeEach(async function () {
        const daoResult = await makeMemDao();
        assert(daoResult.isOk === true);
        memDao = daoResult.val;
        dao = memDao.dao;
    });

    //mocha runs this after each test; we use this to clean up the DAO.
    afterEach(async function () {
        await memDao.tearDown();
    });

    //TODO: add test suites here as needed to test your DAO as you implement it
    //(your DAO is available as variable "dao").

    describe("findByISBN()", () => {
        beforeEach(async () => {
            for (const book of BOOKS) {
                const bookResult = await dao.addBook(book);
                assert(bookResult.isOk === true);
            }
        });

        it("must return a book with a valid isbn", async () => {
            for (const isbn of ISBNS) {
                const result = await dao.findByISBN(isbn);
                assert(result.isOk === true);
            }
        });

        it("must return an error with wrong isbn", async () => {
            for (const isbn of ISBNS) {
                const result = await dao.findByISBN(isbn + "invalid");
                assert(result.isOk === false);
            }
        });

        it("must return an error with empty isbn", async () => {
            const result = await dao.findByISBN("");
            assert(result.isOk === false);
        });
    });

    describe("updateBookCopies()", () => {
        beforeEach(async () => {
            for (const book of BOOKS) {
                const bookResult = await dao.addBook(book);
                assert(bookResult.isOk === true);
            }
        });
        it("must update the book copies with valid _id", async () => {
            for (const isbn of ISBNS) {
                const book = await dao.findByISBN(isbn);
                assert(book.isOk === true);
                const _id = book.val._id;
                const updateResult = await dao.updateBookCopies(_id, 2);
                assert(updateResult.isOk === true);
                assert(updateResult.val.nCopies === book.val.nCopies + 2);
            }
        });

        it("must return an error with an invalid _id", async () => {
            const bookResult = await dao.updateBookCopies("some invalid id", 1);
            assert(bookResult.isOk === false);
        });
    });
});

const PATRONS = ["joe", "bill", "sue", "anne", "karen"];
const ISBNS = BOOKS.slice(0, 5).map((b) => b.isbn);
//LENDS = ISBNS x PATRONS
const LENDS = ISBNS.reduce(
    (acc, isbn) => acc.concat(PATRONS.map((patronId) => ({ isbn, patronId }))),
    []
);
