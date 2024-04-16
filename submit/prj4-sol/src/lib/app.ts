import { Errors } from "cs544-js-utils";

//types defined in library.ts in earlier projects
import * as Lib from "library-types";

import {
	NavLinks,
	LinkedResult,
	PagedEnvelope,
	SuccessEnvelope,
} from "./response-envelopes.js";

import { makeLibraryWs, LibraryWs } from "./library-ws.js";

import { makeElement, makeQueryUrl } from "./utils.js";

export default function makeApp(wsUrl: string) {
	return new App(wsUrl);
}

class App {
	private readonly wsUrl: string;
	private readonly ws: LibraryWs;

	private readonly result: HTMLElement;
	private readonly errors: HTMLElement;

	constructor(wsUrl: string) {
		this.wsUrl = wsUrl;
		this.ws = makeLibraryWs(wsUrl);
		this.result = document.querySelector("#result");
		this.errors = document.querySelector("#errors");
		//TODO: add search handler - Done
		this.searchHandler = this.searchHandler.bind(this);
		const searchBar = document.querySelector("#search");
		if (searchBar) {
			searchBar.addEventListener("blur", this.searchHandler);
		}
	}
	private async searchHandler(event: Event) {
		event.preventDefault();
		const searchField: HTMLInputElement | null = document.getElementById(
			"search"
		) as HTMLInputElement;
		const userSearch: string = searchField.value;
		const baseURL = this.wsUrl + "/api/books";
		const findUrl = makeQueryUrl(baseURL, {
			search: userSearch,
		});
		const searchObj = new LibraryWs(this.wsUrl);
		try {
			const res = await searchObj.findBooksByUrl(findUrl);
			if (res.isOk) {
				console.log(JSON.stringify(res));
				const bookElements: HTMLElement[] = res.val.result.map((book) =>
					this.makeBook(book)
				);
				this.clearErrors();
				this.clearResults();
				const scrollElement: HTMLElement = makeElement("div", {
					["class"]: "scroll",
				});
				const topLinks: HTMLElement[] = this.makeLinks(res.val.links);
				if (topLinks.length > 0) scrollElement.append(...topLinks);

				console.log(scrollElement);
				const scrollElement2: HTMLElement = makeElement("div", {
					["class"]: "scroll",
				});
				const bottomLinks: HTMLElement[] = this.makeLinks(res.val.links);
				if (bottomLinks.length > 0) scrollElement2.append(...bottomLinks);
				this.result.append(
					scrollElement,
					makeElement("ul", { id: "search-results" }, ...bookElements),
					scrollElement2
				);
			}
		} catch (error) {}
		// Further actions related to search handling can be added here
	}
	//TODO: add private methods as needed

	private makeLinks(links: NavLinks): HTMLElement[] {
		let res: HTMLElement[] = [];
		let ele1: HTMLElement = null;
		if (links.prev !== undefined) {
			ele1 = makeElement("a", { ["rel"]: "prev" }, "<<");
		}
		let ele2: HTMLElement = null;
		if (links.next !== undefined) {
			ele2 = makeElement("a", { ["rel"]: "next" }, ">>");
		}
		if (ele1 !== null) res.push(ele1);
		if (ele2 !== null) res.push(ele2);
		return res;
	}

	private makeBook(book: LinkedResult<Lib.XBook>): HTMLElement {
		return makeElement(
			"li",
			{},
			makeElement(
				"span",
				{ ["class"]: "content" },
				book.result.title.toString()
			),
			makeElement("a", { ["class"]: "details" }, "Details...")
		);
	}

	/** unwrap a result, displaying errors if !result.isOk,
	 *  returning T otherwise.   Use as if (unwrap(result)) { ... }
	 *  when T !== void.
	 */
	private unwrap<T>(result: Errors.Result<T>) {
		if (result.isOk === false) {
			displayErrors(result.errors);
		} else {
			return result.val;
		}
	}

	/** clear out all errors */
	private clearErrors() {
		this.errors.innerHTML = "";
		document.querySelectorAll(`.error`).forEach((el) => {
			el.innerHTML = "";
		});
	}

	/** clear out all errors */
	private clearResults() {
		this.result.innerHTML = "";
		document.querySelectorAll(`#search-results`).forEach((el) => {
			el.innerHTML = "";
		});
	}
} //class App

/** Display errors. If an error has a widget or path widgetId such
 *  that an element having ID `${widgetId}-error` exists,
 *  then the error message is added to that element; otherwise the
 *  error message is added to the element having to the element having
 *  ID `errors` wrapped within an `<li>`.
 */
function displayErrors(errors: Errors.Err[]) {
	for (const err of errors) {
		const id = err.options.widget ?? err.options.path;
		const widget = id && document.querySelector(`#${id}-error`);
		if (widget) {
			widget.append(err.message);
		} else {
			const li = makeElement("li", { class: "error" }, err.message);
			document.querySelector(`#errors`)!.append(li);
		}
	}
}

//TODO: add functions as needed
