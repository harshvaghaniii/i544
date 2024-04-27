import React from "react";
import { LibraryWs } from "src/lib/library-ws";
import { LinkedResult } from "src/lib/response-envelopes";
//types defined in library.ts in earlier projects
import * as Lib from "library-types";
import { Errors } from "cs544-js-utils";

const BookDetails = ({
	book,
	borrowers,
}: {
	book: LinkedResult<Lib.XBook>;
	borrowers: Lib.Lend[];
}) => {
	return (
		<>
			<dl className="book-details">
				<dt>ISBN</dt>
				<dd>{book.result.isbn}</dd>
				<dt>Title</dt>
				<dd>{book.result.title}</dd>
				<dt>Authors</dt>
				<dd>{book.result.authors}</dd>
				<dt>Number of Pages</dt>
				<dd>{book.result.pages}</dd>
				<dt>Publisher</dt>
				<dd>{book.result.publisher}</dd>
				<dt>Number of Copies</dt>
				<dd>{book.result.nCopies}</dd>
				<dt>Borrowers</dt>
				<dd id="borrowers">{borrowers.length === 0 && "None"}</dd>
				<dd id="borrowers">
					{borrowers.length > 0 && (
						<ul>
							{borrowers.map((borrower) => {
								return (
									<li>
										<span className="content">{borrower.patronId}</span>
										<button className="return-book">Return Book</button>
									</li>
								);
							})}
						</ul>
					)}
				</dd>
			</dl>

			<form className="grid-form">
				<label htmlFor="patronId">Patron ID</label>
				<span>
					<input id="patronId" /> <br />
					<span className="error" id="patronId-error"></span>
				</span>
				<button type="submit">Checkout Book</button>
			</form>
		</>
	);
};

export default BookDetails;
