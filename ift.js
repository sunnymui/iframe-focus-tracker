const ift = ((window, document) => {
  /*
    HOW TO USE
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

  function track(iframeSelector, callback = () => {}, once = false) {
    /*
    (str) - css selector for element to track
    (fn obj) - callback function to run when tracked element found
    (bool) - whether to track the focus event occuring once or multiple times a session
    */
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
        action: callback
      }]);
    } catch (error) {
      console.log(error);
    }
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
        once
      } = iframeArray[0];
      // run the callback, passing the element
      action(element);
      // untrack if configured to
      untrack(element, once);
    }
  }

  function checkIframeEqual(current) {
    /*
    (dom obj) - the current iframe dom element to check against the active element
    */
    // check for when current active element iframe has changed
    if (current === document.activeElement) {
      // rAF loop is more page perf optimized than a setTimeOut) to poll for changes
      window.requestAnimationFrame(checkIframeEqual);
    } else {
      // return focus to window so next iframe focus registers in tracker
      window.focus();
    }
  }

  function checkIfMultipleTracked(trackedLength, activeIframe) {
    /*
    (int) - length of the tracked array to see if we need to do iframe equality checking
    (dom obj) - the current iframe dom object to check against the active element
    */
    if (trackedLength > 1) {
      window.requestAnimationFrame(checkIframeEqual.bind(this, activeIframe));
    }
  }

  function windowBlurred(e) {
    const tracked = state.tracked;
    // what has focus currently?
    const active = document.activeElement;
    if (active instanceof HTMLIFrameElement) {
      checkIfMultipleTracked(tracked.length, active);
      // check if it is a tracked iframe
      const foundIframe = tracked.filter(item => item.element === active);
      handleIframe(foundIframe);
    }
  }

  // if the window loses focus, that means we're focused on an iframe
  // have to infer it since you can't listen for focus events on iframes
  window.addEventListener('blur', windowBlurred, true);

  return {
    track
  }

})(window, document);
