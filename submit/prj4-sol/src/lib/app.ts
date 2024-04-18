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
		this.clearErrors();
		this.clearResults();
		const searchField: HTMLInputElement | null = document.getElementById(
			"search"
		) as HTMLInputElement;
		const userSearch: string = searchField.value;
		const baseURL = this.wsUrl + "/api/books";
		const findUrl = makeQueryUrl(baseURL, {
			search: userSearch,
		});
		const searchObj = new LibraryWs(this.wsUrl);
		const res = await searchObj.findBooksByUrl(findUrl);
		if (res.isOk) {
			const bookElements: HTMLElement[] = res.val.result.map((book) =>
				this.makeBook(book)
			);
			this.clearErrors();
			this.clearResults();
			const scrollElement: HTMLElement = makeElement("div", {
				["class"]: "scroll",
			});
			const topLinks: HTMLElement[] = await this.makeLinks(res.val.links);
			if (topLinks.length > 0) scrollElement.append(...topLinks);

			const scrollElement2: HTMLElement = makeElement("div", {
				["class"]: "scroll",
			});
			const bottomLinks: HTMLElement[] = await this.makeLinks(res.val.links);
			if (bottomLinks.length > 0) scrollElement2.append(...bottomLinks);
			this.result.append(
				scrollElement,
				makeElement("ul", { id: "search-results" }, ...bookElements),
				scrollElement2
			);
		} else if (res.isOk === false) {
			this.unwrap<PagedEnvelope<Lib.XBook>>(res);
		}

		// Further actions related to search handling can be added here
	}
	//TODO: add private methods as needed

	private async makeLinks(links: NavLinks): Promise<HTMLElement[]> {
		let res: HTMLElement[] = [];
		let ele1: HTMLElement = null;
		if (links.prev !== undefined) {
			ele1 = makeElement("a", { ["rel"]: "prev" }, "<<");
			ele1.addEventListener("click", async (event) => {
				event.preventDefault();
				const searchObj: LibraryWs = new LibraryWs(this.wsUrl);
				const res = await searchObj.findBooksByUrl(links.prev.href);
				if (res.isOk) {
					const bookElements: HTMLElement[] = res.val.result.map((book) =>
						this.makeBook(book)
					);
					this.clearErrors();
					this.clearResults();
					const scrollElement: HTMLElement = makeElement("div", {
						["class"]: "scroll",
					});
					const topLinks: HTMLElement[] = await this.makeLinks(res.val.links);
					if (topLinks.length > 0) scrollElement.append(...topLinks);
					const scrollElement2: HTMLElement = makeElement("div", {
						["class"]: "scroll",
					});
					const bottomLinks: HTMLElement[] = await this.makeLinks(
						res.val.links
					);
					if (bottomLinks.length > 0) scrollElement2.append(...bottomLinks);
					this.result.append(
						scrollElement,
						makeElement("ul", { id: "search-results" }, ...bookElements),
						scrollElement2
					);
				} else if (res.isOk === false) {
					this.unwrap<PagedEnvelope<Lib.XBook>>(res);
				}
			});
		}
		let ele2: HTMLElement = null;
		if (links.next !== undefined) {
			ele2 = makeElement("a", { ["rel"]: "next" }, ">>");
			ele2.addEventListener("click", async (event) => {
				event.preventDefault();
				const searchObj: LibraryWs = new LibraryWs(this.wsUrl);
				const res = await searchObj.findBooksByUrl(links.next.href);
				if (res.isOk) {
					const bookElements: HTMLElement[] = res.val.result.map((book) =>
						this.makeBook(book)
					);
					this.clearErrors();
					this.clearResults();
					const scrollElement: HTMLElement = makeElement("div", {
						["class"]: "scroll",
					});
					const topLinks: HTMLElement[] = await this.makeLinks(res.val.links);
					if (topLinks.length > 0) scrollElement.append(...topLinks);
					const scrollElement2: HTMLElement = makeElement("div", {
						["class"]: "scroll",
					});
					const bottomLinks: HTMLElement[] = await this.makeLinks(
						res.val.links
					);
					if (bottomLinks.length > 0) scrollElement2.append(...bottomLinks);
					this.result.append(
						scrollElement,
						makeElement("ul", { id: "search-results" }, ...bookElements),
						scrollElement2
					);
				} else if (res.isOk === false) {
					this.unwrap<PagedEnvelope<Lib.XBook>>(res);
				}
			});
		}
		if (ele1 !== null) res.push(ele1);
		if (ele2 !== null) res.push(ele2);
		return res;
	}

	private makeBook(book: LinkedResult<Lib.XBook>): HTMLElement {
		const anchorElement: HTMLElement = makeElement(
			"a",
			{ ["class"]: "details" },
			"Details..."
		);
		anchorElement.addEventListener("click", async (event) => {
			event.preventDefault();
			this.clearErrors();
			this.clearResults();
			await this.makeBookDetails(book);
		});
		return makeElement(
			"li",
			{},
			makeElement(
				"span",
				{ ["class"]: "content" },
				book.result.title.toString()
			),
			anchorElement
		);
	}

	private async makeBookDetails(book: LinkedResult<Lib.XBook>): Promise<void> {
		this.clearErrors();
		this.clearResults();
		const appendeesArr: HTMLElement[] = [
			makeElement("dt", {}, "ISBN"),
			makeElement("dd", {}, book.result.isbn),
			makeElement("dt", {}, "Title"),
			makeElement("dd", {}, book.result.title),
			makeElement("dt", {}, "Autors"),
			makeElement("dd", {}, book.result.authors.toString()),
			makeElement("dt", {}, "Number of Pages"),
			makeElement("dd", {}, book.result.pages.toString()),
			makeElement("dt", {}, "Publisher"),
			makeElement("dd", {}, book.result.publisher),
			makeElement("dt", {}, "Number of Copies"),
			makeElement("dd", {}, book.result.nCopies.toString()),
			makeElement("dt", {}, "Borrowers"),
			await this.makeBorrowers(book),
		];
		this.result.append(
			makeElement("dl", { ["class"]: "book-details" }, ...appendeesArr),
			// await this.makeBorrowers(book),
			await this.makeForm(book)
		);
	}

	private async makeBorrowers(
		book: LinkedResult<Lib.XBook>
	): Promise<HTMLElement> {
		const appendeesArr: HTMLElement[] = [];
		this.clearErrors();
		// if (document.getElementById("borrowers"))
		// 	document.getElementById("borrowers").remove();
		const baseURL: URL = makeQueryUrl(this.wsUrl + "/api/lendings", {
			findBy: "isbn",
			isbn: book.result.isbn,
		});
		const lendObj = new LibraryWs(baseURL.toString());
		const res = await lendObj.getLends(book.result.isbn);
		if (res.isOk) {
			if (res.val.length === 0) {
				return makeElement("dd", { ["id"]: "borrowers" }, "None");
			}
			const borrowerDetails: HTMLElement[] = res.val.map((element) =>
				this.makeBorrowersDetails(element, book)
			);
			return makeElement("dd", { ["id"]: "borrowers" }, ...borrowerDetails);

			// document
			// 	.getElementById("borrowers")
			// 	.append(makeElement("ul", {}, ...borrowerDetails));
		}
	}

	private makeBorrowersDetails(
		lend: Lib.Lend,
		book: LinkedResult<Lib.XBook>
	): HTMLElement {
		const { isbn, patronId } = lend;
		const returnButton: HTMLElement = makeElement(
			"button",
			{ ["class"]: "return-book" },
			"Return Book"
		);
		returnButton.addEventListener("click", async (event) => {
			event.preventDefault();
			this.clearErrors();
			const res = await this.ws.returnBook(lend);
			await this.makeBookDetails(book);
		});
		return makeElement(
			"li",
			{},
			makeElement("span", { ["class"]: "content" }, patronId),
			returnButton
		);
	}

	private async makeForm(book: LinkedResult<Lib.XBook>): Promise<HTMLElement> {
		const formSubmitButton: HTMLElement = makeElement(
			"button",
			{ ["type"]: "submit" },
			"Checkout Book"
		);
		formSubmitButton.addEventListener("click", async (event) => {
			event.preventDefault();
			this.clearErrors();
			const patronId: HTMLInputElement = document.getElementById(
				"patronId"
			) as HTMLInputElement;
			const isbn: string = book.result.isbn;
			const patronID: string = patronId.value;
			document.getElementById("patronId").innerHTML = "";
			const lendObj: Lib.Lend = {
				isbn,
				patronId: patronID,
			};
			const url: string = this.wsUrl + "/api/lendings";
			const checkoutObj = new LibraryWs(url);
			const result = await checkoutObj.checkoutBook(lendObj);
			if (result.isOk) {
				await this.makeBookDetails(book);
			} else if (result.isOk === false) {
				displayErrors(result.errors);
			}
		});
		const formArr: HTMLElement[] = [
			makeElement("label", { ["for"]: "patronID" }, "Patron ID"),
			makeElement(
				"span",
				{},
				makeElement("input", { ["id"]: "patronId" }),
				makeElement("br", {}),
				makeElement("span", { ["class"]: "error", ["id"]: "patronId-error" })
			),
			formSubmitButton,
		];
		return makeElement("form", { ["class"]: "grid-form" }, ...formArr);
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
