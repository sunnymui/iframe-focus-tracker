/*
  HOW TO USE
  First you need to: import * as ift from './ift-es6-module.js'
  Use the ift.track() function to declare iframe elements you wish to track interaction for.
  Example:
  // track an iframe element with a class="thingy" and log the class when interacted with, but only on the first time
  ift.track('.thingy', (thingy)=>{console.log(thingy.className);}, true);
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
  */
  // default config
  const defaultConfig = {once: false, form: false};
  // defaults then overwrite with passed config to allow partial custom config
  config = {...defaultConfig, ...config}
  const {once, form} = config;
  try {
    const trackedElement = document.querySelector(iframeSelector);
    // watch out for elements that don't exist, likely due to a mistyped selector
    if (!trackedElement) {
      throw 'iFrame Tracker: Element not found: ' + iframeSelector
    }
    // remember the element to watch and associated info for what to do with it
    state.tracked = state.tracked.concat([{
      element: trackedElement,
      once: once,
      action: callback,
      form: form
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

function untrack(element, shouldUntrack) {
  /*
    (dom obj) - the dom element to stop tracking
    (bool) - should we stop tracking this element?
  */
  if (shouldUntrack) {
    // don't keep the untracked item
    state.tracked = state.tracked.filter(item => item.element !== element);
    // save it to untracked array just in case
    state.untracked.concat([element]);
  }
}

function handleIframe(iframeArray) {
  /*
   (arr) - array of tracked items from state that matched the active element
  */
  // if we matched a tracked element
  if (iframeArray.length > 0) {
    const {
      element,
      action,
      once,
      form
    } = iframeArray[0];
    // run the callback, passing the element
    action(element);
    // untrack if configured to
    untrack(element, once);
    // if not a form, reset window focus to allow for multiple/inter iframe clicks
    // executes async at end of call stack so focus change wont get overridden
    (!form && window.setTimeout(window.focus, 0));
  }
}

function windowBlurred(e) {
  /*
  (obj) - the event object
  */
  const tracked = state.tracked;
  // what has focus currently?
  const active = document.activeElement;
  const first_blur = true;
  if (active instanceof HTMLIFrameElement) {
    // check if it is a tracked iframe
    const foundIframe = tracked.filter(item => item.element === active);
    handleIframe(foundIframe);
  }
}

// if the window loses focus, that means we're focused on an iframe
// have to infer it since you can't listen for focus events on iframes
window.addEventListener('blur', windowBlurred, true);

export {
  ifReady,
  track
};
