import React from "react";
import { LibraryWs } from "src/lib/library-ws";
import { Link, LinkedResult, PagedEnvelope } from "src/lib/response-envelopes";
//types defined in library.ts in earlier projects
import * as Lib from "library-types";

/**
 * Start of Component
 */

const BookResults = ({
	bookResult,
	onChangeResults,
	object,
	detailsHandler,
}: {
	bookResult: PagedEnvelope<Lib.XBook>;
	onChangeResults: (
		e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
		result: PagedEnvelope<Lib.XBook>
	) => Promise<void>;
	object: LibraryWs;
	detailsHandler: (
		e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
		book: LinkedResult<Lib.XBook>
	) => Promise<void>;
}) => {
	const linkHandler = async (
		e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
		url: string
	) => {
		const response = await object.findBooksByUrl(url);
		if (response.isOk) {
			onChangeResults(e, response.val as PagedEnvelope<Lib.XBook>);
		}
	};

	if (bookResult?.isOk && bookResult.result.length > 0) {
		return (
			<>
				<div className="scroll">
					{bookResult.links.prev && (
						<a
							rel="prev"
							onClick={(e) => linkHandler(e, bookResult.links.prev.href)}
						>
							&lt;&lt;
						</a>
					)}
					{bookResult.links.next && (
						<a
							rel="next"
							onClick={(e) => linkHandler(e, bookResult.links.next.href)}
						>
							&gt;&gt;
						</a>
					)}
				</div>
				<ul id="search-results">
					{bookResult.result.map((book) => {
						return (
							<li key={book.result.isbn}>
								<span className="content">{book.result.title}</span>
								<a className="details" onClick={(e) => detailsHandler(e, book)}>
									details...
								</a>
							</li>
						);
					})}
				</ul>
				<div className="scroll">
					{bookResult.links.prev && (
						<a
							rel="prev"
							onClick={(e) => linkHandler(e, bookResult.links.prev.href)}
						>
							&lt;&lt;
						</a>
					)}
					{bookResult.links.next && (
						<a
							rel="next"
							onClick={(e) => linkHandler(e, bookResult.links.next.href)}
						>
							&gt;&gt;
						</a>
					)}
				</div>
			</>
		);
	} else return <></>;
};

export default BookResults;
