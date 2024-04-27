import React from "react";
import { LibraryWs } from "src/lib/library-ws";
import { PagedEnvelope } from "src/lib/response-envelopes";
//types defined in library.ts in earlier projects
import * as Lib from "library-types";
const BookResults = ({
	bookResult,
}: {
	bookResult: PagedEnvelope<Lib.XBook>;
}) => {
	if (bookResult?.isOk && bookResult.result.length > 0) {
		return (
			<ul id="search-results">
				{bookResult.result.map((book) => {
					return (
						<li key={book.result.isbn}>
							<span className="content">{book.result.title}</span>
							<a className="details">details...</a>
						</li>
					);
				})}
			</ul>
		);
	} else return <></>;
};

export default BookResults;
