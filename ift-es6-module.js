/*
  HOW TO USE
  Use the ift.track() function to declare iframe elements you wish to track interaction for.
  Example:
  // track an iframe element with a class="thingy" and log the class when interacted with, but only on the first time
  ift.track('.thingy', (thingy)=>{console.log(thingy.className);}, {once:true});
*/

// to allow single or multiple occurance tracking functionality
let state = {
  tracked: [],
  untracked: []
};

function track(iframeSelector, callback = () => {}, config) {
  /*
  (str) - css selector for element to track
  (fn obj) - callback function to run when tracked element found
  (obj) - config with options for:
            once - track only first interaction
            form - is this a form or complex element? sequential iframe
                   click tracking will be disabled since it blocks forms
                   from working due to focus moving to window constantly
            start - when/which focus event to start running callback at
  */
  // default config
  const defaultConfig = {
    once: false,
    form: false,
    start: 0
  };
  // defaults then overwrite with passed config to allow partial custom config
  config = {...defaultConfig, ...config}
  const {once, form, start} = config;
  // start interactions counter at 0 for state.tracked obj
  const interactions = 0;
  try {
    const element = document.querySelector(iframeSelector);
    // watch out for elements that don't exist, likely due to a mistyped selector
    if (!element) {
      throw 'iFrame Tracker: Element not found: ' + iframeSelector
    }
    // remember the element to watch and associated info for what to do with it
    state.tracked = state.tracked.concat([{
      element,
      once,
      callback,
      form,
      interactions,
      start
    }]);
  } catch (error) {
    console.log(error);
  }
}

function checkIframeExists(selector, resolve) {
 /*
 (str) - css selector string to query dom for iframe element
 (fn obj) - resolve function for use in a Promise
 */
  const iframe = document.querySelector(selector);
  // rAF loop (page perf > setInterval) to check DOM, resolve promise w/ iframe
  !iframe ? window.requestAnimationFrame(checkIframeExists.bind(this, selector, resolve)) : resolve(iframe)
}

function ifReady(selector, callback) {
  /*
  (str) - the css selector string to query the dom for the iframe
  (fn obj) - callback function to run when ready, passed the selector str
  */
  // in case of dynamically added iframe to wait for it to exist in dom
  let iframeInDOM = new Promise((resolve, reject) => {
    // monitor page for the iframe existence in dom in case of dynamic append
    window.requestAnimationFrame(checkIframeExists.bind(this, selector, resolve));
  });
  // after iframe exists, wait for load event before running callback
  iframeInDOM.then((iframe) => {
    iframe.addEventListener('load', (e) => {
      callback(selector);
    });
  });
}

function updateState(iframeResults, shouldUntrack) {
  /*
    (obj) - obj w/ 2 arrays, match - the matched tracked item to found iframe
    and unmatched - the nonmatched items from state.tracked
    (bool) - should we stop tracking this element?
  */
  let {tracked, untracked} = state;
  let {matched: [match], unmatched} = iframeResults;
  const {interactions, start} = match;

  // increment the match's # of interactions
  match.interactions += 1;

  if (shouldUntrack && (interactions >= start)) {
    // leave out the untracked item in tracked
    tracked = unmatched;
    // save it to untracked array just in case
    untracked = untracked.concat(match);
  } else {
    // put the match and unmatches back together as new tracked array
    tracked = untracked.concat(match);
  }

  return {
    tracked,
    untracked
  }
}

function handleIframe(iframeResults) {
  /*
   (obj) - obj w/ 2 arrays, match - the matched tracked item to found iframe
   and unmatched - the nonmatched items from state.tracked
  */
  const matched = iframeResults.matched;
  // if we matched a tracked element
  if (matched.length > 0) {
    const {
      element,
      callback,
      once,
      form,
      interactions,
      start
    } = matched[0];
    // only run callback if interaction count is high enough to start
    if (interactions >= start) {
      // run the callback, passing the element
      callback(element);
    }
    // build new state in case we are untracking an iframe set to 1 time tracking
    const updatedState = updateState(iframeResults, once);
    // update current state
    state = {
      ...state,
      ...updatedState
    }
    // if not a form, reset window focus to allow for multiple/inter iframe clicks
    // executes async at end of call stack so focus change wont get overridden
    (!form && window.setTimeout(window.focus, 0));
  }
}

function windowBlurred(e) {
  /*
  (obj) - the event object
  */
  const {tracked} = state;
  // what has focus currently?
  const active = document.activeElement;
  if (active instanceof HTMLIFrameElement) {
    // checks if it is a tracked iframe and saves results
    const matcher = (accumulator, current) => {
      (current.element === active) ?
        accumulator.matched.push(current) :
        accumulator.unmatched.push(current);
      return accumulator
    };
    const foundIframes = tracked.reduce(matcher, {matched:[], unmatched:[]});

    handleIframe(foundIframes);
  }
}

// if the window loses focus, that means we're focused on an iframe
// have to infer it since you can't listen for focus events on iframes
window.addEventListener('blur', windowBlurred, true);

export {
  ifReady,
  track
};
