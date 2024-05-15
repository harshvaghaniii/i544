import React from 'react';

import { Errors } from 'cs544-js-utils';

import * as Lib from 'library-types';

import { WsResult } from './app.js';

import { NavLinks, LinkedResult, PagedEnvelope, SuccessEnvelope }
  from '../lib/response-envelopes.js';

import { LibraryWs } from '../lib/library-ws.js';



type BookDisplayProps = {
  book: Lib.XBook,
  ws: LibraryWs,
  widgetErrors: Record<string, string>,
  processWsResult: <T,>(result: Errors.Result<T>) => WsResult<T>
};

export default function BookDisplay(props: BookDisplayProps) {
  const { book, ws, widgetErrors, processWsResult } = props;
  const [borrowers, setBorrowers] = React.useState<string[]>([]);

  const updateBorrowers = async () => {
    const lendsResult = await ws.getLends(book.isbn);
    const lends = processWsResult(lendsResult);
    if (lends.isOk) setBorrowers(lends.result.map(lend => lend.patronId));
  };
    
  React.useEffect(() => {
    (async () => await updateBorrowers())();
  }, []);

  const checkoutBook = async (patronId: string) => {
    const wsResult =
      processWsResult(await ws.checkoutBook({isbn: book.isbn, patronId}));
    if (wsResult.isOk) await updateBorrowers();
  }

  const returnBook = async (patronId: string) => {
    const wsResult =
      processWsResult(await ws.returnBook({isbn: book.isbn, patronId}));
    if (wsResult.isOk) await updateBorrowers();
  }


  return <>
    <dl className="book-details">
      <dt>ISBN</dt>
      <dd>{book.isbn}</dd>
      <dt>Title</dt>
      <dd>{book.title}</dd>
      <dt>Authors</dt>
      <dd>{book.authors.join('; ')}</dd>
      <dt>Number of Pages</dt>
      <dd>{book.pages}</dd>
      <dt>Publisher</dt>
      <dd>{book.publisher}</dd>
      <dt>Number of Copies</dt>
      <dd>{book.nCopies}</dd>
      <dt>Borrowers</dt>
      <dd id="borrowers">
        <BorrowersDisplay borrowers={borrowers} returnBook={returnBook}/>
      </dd>
    </dl>

    <CheckoutForm checkoutBook={checkoutBook} widgetErrors={widgetErrors}/>
  </>;
}

type CheckoutFormProps = {
  checkoutBook: (patronId: string) => Promise<void>,
  widgetErrors: Record<string, string>,
}

function CheckoutForm(props: CheckoutFormProps) {
  const { checkoutBook, widgetErrors } = props;
  const [patronId, setPatronId] = React.useState('');
  const submit = async () => await checkoutBook(patronId);
  return (
    <form className="grid-form" onSubmit={submit}>
      <label htmlFor="patronId">Patron ID</label>
      <span>
        <input id= "patronId" onChange={ev => setPatronId(ev.target.value)}/>
        <br/>
        <span className="error" id="patronId-error">
          {widgetErrors.patronId ?? widgetErrors.isbn}
        </span>
      </span>
      <button type="submit">Checkout Book</button>
    </form>    
  );
}

type BorrowersDisplayProps = {
  borrowers: string[],
  returnBook: (patronId: string) => Promise<void>,
};

function BorrowersDisplay(props: BorrowersDisplayProps) {
  const { borrowers, returnBook, } = props;
  return (borrowers.length === 0)
    ? 'None'
    : (
      <ul>
	{borrowers.map((b: string) => {
	  const doReturn = () => returnBook(b);
	  return (
	    <li key={b}>
	      <span className="content">{b}</span>
	      <button className="return-book" onClick={doReturn}>
	        Return Book
	      </button>
	    </li>
	  )})
	}
      </ul>
    );
}
