import React, { useEffect, useState } from "react";

import { Errors } from "cs544-js-utils";

//types defined in library.ts in earlier projects
import * as Lib from "library-types";

import {
	NavLinks,
	LinkedResult,
	PagedEnvelope,
	SuccessEnvelope,
} from "../lib/response-envelopes.js";

import { makeLibraryWs, LibraryWs } from "../lib/library-ws.js";
import BookResults from "./BookResults.js";
import { makeQueryUrl } from "../lib/utils.js";
import ErrorComponent from "./ErrorComponents.js";
import BookDetails from "./BookDetails.js";

type AppProps = {
	wsUrl: string;
};

export function App(props: AppProps) {
	const { wsUrl } = props;
	let libraryWS: LibraryWs = new LibraryWs(wsUrl);

	const [bookResult, setBookResults] = useState<PagedEnvelope<Lib.XBook>>(null);
	const [borrowers, setBorrowers] = useState<Errors.Result<Lib.Lend[]>>(null);
	const [errors, setErrors] = useState<Errors.Err[]>([]);
	const [widgetErrors, setWidgetErrors] = useState<Errors.Err[]>([]);
	const [dbErrors, setDbErrors] = useState<Errors.Err[]>([]);
	const [currentBook, setCurrentBook] = useState<LinkedResult<Lib.XBook>>(null);

	/**
	 * Updating database errors
	 * @param errorArr
	 */

	const updateDbErrors = (errorArr: Errors.Err[]) => {
		setDbErrors(errorArr);
	};

	const updateErrors = (errorArr: Errors.Err[]) => {
		setErrors(errorArr);
	};

	/**
	 * Updating widget errors
	 * @param errorArr
	 */

	const updateWidgetErrors = (errorArr: Errors.Err[]) => {
		setWidgetErrors(errorArr);
	};

	const blurHandler = async (
		e: React.FocusEvent<HTMLInputElement, Element>
	) => {
		e.preventDefault();
		const searchURL: string = makeQueryUrl(`${wsUrl}/api/books`, {
			search: e.target.value,
		}).href;
		const response = await libraryWS.findBooksByUrl(searchURL);
		if (response.isOk) {
			updateErrors([]);
			updateDbErrors([]);
			updateWidgetErrors([]);
			setBookResults((prevState) => response.val);
		} else if (response.isOk === false) {
			if(response.errors.length === 1 && response.errors[0].options.code === "UNKNOWN") {
				updateDbErrors(response.errors);
				return;
			}
			updateWidgetErrors(response.errors);
			updateErrors([]);
			updateDbErrors([]);
			setBookResults(null);
		}
		setCurrentBook(null);
		setBorrowers(null);
	};

	const handleLinks = async (
		e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
		result: PagedEnvelope<Lib.XBook>
	) => {
		e.preventDefault();
		setBookResults(result);
	};

	const getDetails = async (
		e:
			| React.MouseEvent<HTMLAnchorElement, MouseEvent>
			| React.MouseEvent<HTMLButtonElement, MouseEvent>,
		book: LinkedResult<Lib.XBook>
	) => {
		e.preventDefault();
		setBookResults(null);
		setErrors([]);
		const lends: Errors.Result<Lib.Lend[]> = await libraryWS.getLends(
			book.result.isbn
		);
		setCurrentBook(book);
		setBorrowers(lends);
	};

	return (
		<>
			{dbErrors.length > 0 && (
				<ul id="errors">
					{dbErrors.map((error) => {
						return (
							<li key={error.message} className="error">
								{error.message}
							</li>
						);
					})}
				</ul>
			)}
			<form className="grid-form">
				<label htmlFor="search">Search</label>
				<span>
					<input id="search" onBlur={(e) => blurHandler(e)} />
					<br />
					<span className="error" id="search-error">
						{widgetErrors.map((error) => {
							return error.message;
						})}
					</span>
				</span>
			</form>

			<div id="result">
				{bookResult?.isOk && bookResult.result.length > 0 && (
					<BookResults
						bookResult={bookResult}
						onChangeResults={handleLinks}
						object={libraryWS}
						detailsHandler={getDetails}
					/>
				)}
				{borrowers?.isOk && (
					<BookDetails
						book={currentBook}
						borrowers={borrowers.val}
						object={libraryWS}
						updateList={getDetails}
						updateErrors={updateErrors}
						errors={errors}
						dbErrors={dbErrors}
						updateDbErrors={updateDbErrors}
					/>
				)}
				{/*TODO*/}
			</div>
		</>
	);
}
