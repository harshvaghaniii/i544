import { Errors } from "cs544-js-utils";

import {
	SuccessEnvelope,
	PagedEnvelope,
	ErrorEnvelope,
} from "./response-envelopes.js";
import * as Lib from "library-types";

import * as Utils from "./utils.js";

type NonPagedResult<T> = SuccessEnvelope<T> | ErrorEnvelope;
type PagedResult<T> = PagedEnvelope<T> | ErrorEnvelope;

export function makeLibraryWs(url: string) {
	return new LibraryWs(url);
}

export class LibraryWs {
	//base url for these web services
	private url;

	constructor(url: string) {
		this.url = url;
	}

	/** given an absolute books url bookUrl ending with /books/api,
	 *  return a SuccessEnvelope for the book identified by bookUrl.
	 */
	async getBookByUrl(
		bookUrl: URL | string
	): Promise<Errors.Result<SuccessEnvelope<Lib.XBook>>> {
		return getEnvelope<Lib.XBook, SuccessEnvelope<Lib.XBook>>(bookUrl);
	}

	/** given an absolute url findUrl ending with /books with query
	 *  parameters search and optional query parameters count and index,
	 *  return a PagedEnvelope containing a list of matching books.
	 */
	async findBooksByUrl(
		findUrl: URL | string
	): Promise<Errors.Result<PagedEnvelope<Lib.XBook>>> {
		return getEnvelope<Lib.XBook, PagedEnvelope<Lib.XBook>>(findUrl);
	}

	/** check out book specified by lend */
	//make a PUT request to /lendings
	async checkoutBook(lend: Lib.Lend): Promise<Errors.Result<void>> {
		const url: string = `${this.url}/api/lendings`;
		const options = {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(lend),
		};
		try {
			const result = await fetchJson<Lib.Lend | ErrorEnvelope>(
				this.url + "/api/lendings",
				options
			);
			if (result.isOk) return Errors.VOID_RESULT;
		} catch (error) {
			return Errors.errResult(`${options.method} ${url}: error ${error}`);
		}
	}

	/** return book specified by lend */
	//make a DELETE request to /lendings
	async returnBook(lend: Lib.Lend): Promise<Errors.Result<void>> {
		const url: string = `${this.url}/api/lendings`;
		const options = {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(lend),
		};
		try {
			const result = await fetchJson<Lib.Lend | ErrorEnvelope>(url, options);
			if (result.isOk) return Errors.VOID_RESULT;
		} catch (error) {
			return Errors.errResult(`${options.method} ${url}: error ${error}`);
		}
	}

	/** return Lend[] of all lendings for isbn. */
	//make a GET request to /lendings with query-params set
	//to { findBy: 'isbn', isbn }.
	async getLends(isbn: string): Promise<Errors.Result<Lib.Lend[]>> {
		const lendUrl: URL = Utils.makeQueryUrl(`${this.url}/api/lendings`, {
			findBy: isbn,
		});
		try {
			const result = await fetchJson<Lib.Lend[] | ErrorEnvelope>(lendUrl);
			if (result.isOk) {
				return Errors.okResult<Lib.Lend[]>(result.val as Lib.Lend[]);
			}
		} catch (error) {
			return Errors.errResult(`Failed to fetch lendings: ${error}`);
		}
	}
}

/** Return either a SuccessEnvelope<T> or PagedEnvelope<T> wrapped
 *  within a Errors.Result.  Note that the caller needs to instantiate
 *  both type parameters appropriately.
 */
async function getEnvelope<T, T1 extends SuccessEnvelope<T> | PagedEnvelope<T>>(
	url: URL | string
): Promise<Errors.Result<T1>> {
	const result = await fetchJson<T1 | ErrorEnvelope>(url);
	if (result.isOk === true) {
		const response = result.val;
		if (response.isOk === true) {
			return Errors.okResult(response);
		} else return new Errors.ErrResult(response.errors as Errors.Err[]);
	} else {
		return result as Errors.Result<T1>;
	}
}

const DEFAULT_FETCH = { method: "GET" };

/** send a request to url, converting any exceptions to an
 *  error result.
 */
async function fetchJson<T>(
	url: URL | string,
	options: RequestInit = DEFAULT_FETCH
): Promise<Errors.Result<T>> {
	//<https://github.com/microsoft/TypeScript/blob/main/src/lib/dom.generated.d.ts#L26104>
	try {
		const response = await fetch(url, options);
		return Errors.okResult((await response.json()) as T);
	} catch (err) {
		console.error(err);
		return Errors.errResult(`${options.method} ${url}: error ${err}`);
	}
}

//TODO: add other functions as needed
