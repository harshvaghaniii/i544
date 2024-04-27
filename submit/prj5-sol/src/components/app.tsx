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

type AppProps = {
	wsUrl: string;
};

export function App(props: AppProps) {
	const { wsUrl } = props;
	let libraryWS: LibraryWs = new LibraryWs(wsUrl);

	const [bookResult, setBookResults] = useState<PagedEnvelope<Lib.XBook>>(null);
	const [errors, setErrors] = useState<Errors.Err[]>([]);

	const blurHandler = async (
		e: React.FocusEvent<HTMLInputElement, Element>
	) => {
		e.preventDefault();
		const searchURL: string = makeQueryUrl(`${wsUrl}/api/books`, {
			search: e.target.value,
		}).href;
		const response = await libraryWS.findBooksByUrl(searchURL);
		if (response.isOk) {
			setErrors([]);
			console.log(response.val);
			setBookResults((prevState) => response.val);
		} else if (response.isOk === false) {
			setErrors(response.errors);
			setBookResults(null);
		}
	};

	const handleLinks = async (
		e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
		result: PagedEnvelope<Lib.XBook>
	) => {
		e.preventDefault();
		setBookResults(result);
	};

	//TODO

	return (
		<>
			<ul id="errors">
				{errors.length > 0 && <ErrorComponent errors={errors} />}
			</ul>

			<form className="grid-form">
				<label htmlFor="search">Search</label>
				<span>
					<input id="search" onBlur={(e) => blurHandler(e)} />
					<br />
					<span className="error" id="search-error"></span>
				</span>
			</form>

			<div id="result">
				{bookResult?.isOk && bookResult.result.length > 0 && (
					<BookResults
						bookResult={bookResult}
						onChangeResults={handleLinks}
						object={libraryWS}
					/>
				)}
				{/*TODO*/}
			</div>
		</>
	);
}
