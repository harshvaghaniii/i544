import React, { useState } from "react";
import { LibraryWs } from "src/lib/library-ws";
import { LinkedResult } from "src/lib/response-envelopes";
//types defined in library.ts in earlier projects
import * as Lib from "library-types";
import { Errors } from "cs544-js-utils";

const BookDetails = ({
	book,
	borrowers,
	object,
	updateList,
	updateErrors,
}: {
	book: LinkedResult<Lib.XBook>;
	borrowers: Lib.Lend[];
	object: LibraryWs;
	updateList: (
		e:
			| React.MouseEvent<HTMLAnchorElement, MouseEvent>
			| React.MouseEvent<HTMLButtonElement, MouseEvent>,
		book: LinkedResult<Lib.XBook>
	) => Promise<void>;
	updateErrors: (errorArr: Errors.Err[]) => void;
}) => {
	const [patronID, setPatronID] = useState<string>("");

	const checkoutHandler = async (
		e: React.MouseEvent<HTMLButtonElement, MouseEvent>
	) => {
		e.preventDefault();
		const response = await object.checkoutBook({
			isbn: book.result.isbn,
			patronId: patronID,
		});
		if (response.isOk) {
			updateList(e, book);
		} else if (response.isOk === false) {
			updateErrors(response.errors);
		}
	};

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
									<li key={borrower.patronId}>
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
					<input
						id="patronId"
						value={patronID}
						onChange={(e) => setPatronID(e.target.value)}
					/>{" "}
					<br />
					<span className="error" id="patronId-error"></span>
				</span>
				<button type="submit" onClick={(e) => checkoutHandler(e)}>
					Checkout Book
				</button>
			</form>
		</>
	);
};

export default BookDetails;
