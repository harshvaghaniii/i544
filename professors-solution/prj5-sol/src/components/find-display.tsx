import React from 'react';

import * as Lib from 'library-types';

import { NavLinks, LinkedResult, PagedEnvelope, SuccessEnvelope }
  from '../lib/response-envelopes.js';

type FindDisplayProps = {
  result: PagedEnvelope<Lib.XBook>,
  setSearchUrl: (url: string) => void,
  setBookUrl: (url: string) => void,
};

export default function FindDisplay(props: FindDisplayProps) {
  const { result, setSearchUrl, setBookUrl } = props;
  const links = result.links;
  const [prev, next] = [ links.prev?.href, links.next?.href ];
  const scrolls = [];
  const makeScroll = (rel: string, href: string, text: string) => (
    <a href="#" rel={rel} key={rel} onClick={() => setSearchUrl(href)}>
      {text}
    </a>
  );
  if (prev) scrolls.push(makeScroll('prev', prev, '<<'));
  if (next) scrolls.push(makeScroll('next', next, '>>'));
   return <>
     <div className="scroll">{scrolls}</div>
     <ul id="results">
       {result.result.map(selfResult => {
	 const self = selfResult.links.self.href;
	 const doBook = () => setBookUrl(self);
	 return (
	   <li key={selfResult.result.isbn}>
	     <span className="content">
  	       {selfResult.result.title}
	     </span>
	     <a className="details" onClick={doBook}>details...</a>
	   </li>
         )})
       }
     </ul>
     <div className="scroll">{scrolls}</div>
  </>;
}

const SCROLLS: Record<string, string> = {
  prev: '<<',
  next: '>>',
};
