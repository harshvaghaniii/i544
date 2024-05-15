import React from 'react';

import { Errors } from 'cs544-js-utils';

//types defined in library.ts in earlier projects
import * as Lib from 'library-types';

import { makeQueryUrl } from '../lib/utils.js';

import BookDisplay from './book-display.js';
import FindDisplay from './find-display.js';

import { NavLinks, LinkedResult, PagedEnvelope, SuccessEnvelope }
  from '../lib/response-envelopes.js';

import { makeLibraryWs, LibraryWs } from '../lib/library-ws.js';

type AppProps = {
  wsUrl: string
};

type DisplayResult = 
  { type: 'findBooks', result: PagedEnvelope<Lib.XBook>, } |
  { type: 'getBook', result: Lib.XBook };

export type WsResult<T> = { isOk: true, result: T } | { isOk: false };

type AppErrors = {
  globalErrors: GlobalErrors,
  widgetErrors: WidgetErrors,
};

export function App(props: AppProps) {

  const { wsUrl } = props;
  const ws = makeLibraryWs(wsUrl);
  const [url, setUrl] = React.useState(wsUrl);
  const [isDetail, setIsDetail] = React.useState(false);
  const [appErrors, setAppErrors] =
    React.useState<AppErrors>({globalErrors: [], widgetErrors: {}});
  const doSearch = (ev: React.FormEvent<HTMLInputElement>) => {
    const search = { search: ev.currentTarget.value, };
    const url = makeQueryUrl(wsUrl + '/api/books', search);
    setIsDetail(false);
    setUrl(url.href);
  };
  const [ displayResult, setDisplayResult ] =
    React.useState<DisplayResult>(null);

  const setSearch = (url: string) => {
    setIsDetail(false); setUrl(url);
  };
  const setBook = (url: string) => {
    setIsDetail(true); setUrl(url);
  };
  

  const processWsResult = <T,>(result: Errors.Result<T>) : WsResult<T>  => {
    if (result.isOk === true) {
      setAppErrors({ globalErrors: [], widgetErrors: {} });
      return { isOk: true, result: result.val };
    }
    else {
      const appErrors = errorsResult(result.errors);
      setAppErrors(appErrors);
      return { isOk: false };
    }
  };

  React.useEffect(() => {
    (async () => {
      if (!isDetail && url !== wsUrl) {
	const wsResult = processWsResult(await ws.findBooksByUrl(url));
	if (wsResult.isOk) {
	  setDisplayResult({ type: 'findBooks' as const,
			     result: wsResult.result });
	}
      }
    })();
  }, [url, isDetail]);

  React.useEffect(() => {
    (async () => {
      if (isDetail) {
	const wsResult = processWsResult(await ws.getBookByUrl(url));
	if (wsResult.isOk) {
	  setDisplayResult({ type: 'getBook' as const,
			     result: wsResult.result.result });
	}
      }
    })();
  }, [url, isDetail]);

  let result: React.ReactElement;
  if (!displayResult) {
    result = <></>;
  }
  else if (displayResult.type === 'findBooks') {
    result = <FindDisplay result={displayResult.result}
                          setSearchUrl={setSearch}
                          setBookUrl={setBook}/>
  }
  else if (displayResult.type === 'getBook') {
    result = <BookDisplay book={displayResult.result} ws={ws}
                          widgetErrors={appErrors.widgetErrors}
                          processWsResult={processWsResult}/>
  }
  const { widgetErrors, globalErrors } = appErrors;
  return <>
    <GlobalErrors errors={globalErrors}/>
    
    <form className="grid-form">
      <label htmlFor="search">Search</label>
      <span>
    <input id="search" onBlur={doSearch}/><br/>
      <span className="error" id="search-error">{widgetErrors.search}</span>
      </span>
    </form>
    <div id="result">{result}</div>
   </>

}

type WidgetErrors = Record<string, string>;
type GlobalErrors = string[];
type GlobalErrorsProps = {
  errors: string[],
};

function GlobalErrors(props: GlobalErrorsProps) {
  const errors =
    props.errors.map((e, i) => <li className="error" key={i}>{e}</li>);
  return <ul>{errors}</ul>;
}



function errorsResult(errors: Errors.Err[]) : AppErrors {
  const widgetErrors = {} as WidgetErrors;
  const globalErrors = [];
  for (const err of errors) {
    if (err.options.widget ?? err.options.path) {
      widgetErrors[err.options.widget?? err.options.path] = err.message;
    }
    else {
      globalErrors.push(err.message);
    }
  }
  return { globalErrors, widgetErrors };
}
