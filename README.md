# Cross Domain iFrame Focus Tracker

Can't attach event listeners to a cross domain `<iframe>` element and totally BUMMED? You wanted to track interactions with your Youtube embed, social media like button, or some form embed, but ran into issues? Trying to send Analytics events for iframe interactions?
  
Me too.

## How to Use

Use the ift.track() function to declare iframe elements you wish to track interaction for. ift.track takes 3 arguments:

1. CSS Selector for the element to track (string) - Selector to use to grab the element, anything that works with document.querySelector.
2. Callback (function) - A function to be executed when the tracked element gets focus, will be passed the tracked element as the first parameter
3. Whether to track once (boolean) - Default is false. If set to true, it will only track the focus event the first time it happens and execute the callback only once.

Example JS: 
``` 
  // consider whether you need to listen for the document to be ready before initiating tracking
  
  // track an iframe element with a class="thingy" and log the class when interacted with, but only on the first time
  ift.track('.thingy', (thingy)=>{console.log(thingy.className);}, true);
``` 
Given this HTML:
```
  <iframe class="thingy" src="https://someiframeurl.com" width="100%" height="500px" frameborder="0"></iframe>
```

### Sample IRL Usage

Here's an example using it to track interactions with an embedded form and sending that data to Google Analytics as an event:
```
function ga_embed_event_handler(element){
    if (ga){
        ga('send', 'event', 'Maker Register Form', 'interaction', 'Maker Page - Maker register form interacted with');
    }
}

const embed_selector = '#maker-register';

// wait for maker register form to load before tracking
const iframe = document.querySelector(embed_selector);
iframe.addEventListener('load', ()=>{
      // in case they interact with the blank iframe box before it loads, only want to track if they actually see the form and interact
      window.focus(); 
      ift.track(embed_selector, ga_embed_event_handler, true);
});
```

What if you have a dynamically added iframe element? You can wrap your basic onload listener in a requestAnimationFrame loop that polls the page until the iframe page is found like so:

```
function checkIframeLoaded(timestamp) {
 /* Use an rAF loop (more page perf optimized than a setTimeOut) to check for when iframe has loaded*/
  try {
    const iframe = document.querySelector(embed_selector);
    if (!iframe) {
      throw 'Not Created Yet';
    }
    iframe.addEventListener('load', ()=>{
      // in case they interact with the blank iframe box before it loads, only want to track if they actually see the form and interact
      window.focus(); 
      ift.track(embed_selector, ga_embed_event_handler, true);
    });
  }
  catch(error) {
    window.requestAnimationFrame(checkIframeLoaded);
  }
}

// monitor page for the iframe to be added
window.requestAnimationFrame(checkIframeLoaded);
```

Have several iframes to track on the page? You can do something like this:
```
const elements = [{
  selector: '#give-map',
  handler: ga_map_event_handler
}, {
  selector: '.airtable-embed',
  handler: ga_assist_event_handler
}];

elements.forEach((current, i) => {
  // wait for iframe to load before tracking
  const iframe = document.querySelector(current.selector);
  iframe.addEventListener('load', ()=>{
      // in case they interact with the blank iframe box before it loads, only want to track if they actually see the form and interact
      window.focus(); 
      ift.track(current.selector, current.handler, true);
  });
});
```

## Caveats

*This only tracks each time focus changes from the window to the iframe, so it can't detect anything about what you are clicking on inside the iframe, just that the iframe is being interacted with* 

## How it Works

This checks if the `window` object has focus. If it loses focus, that means the user has shifted focus to an iframe element. Every time you move from window -> iframe, it'll track the event. Different iframes are differentiated by comparing the current active element to cached versions. When focus is moved to an iframe, a setTimeout call with a window focusing callback will be set so focus will be reset at the end of current JS execution and subsequent clicks--either on the same iframe or other iframes--will be tracked.

Based on this answer https://stackoverflow.com/a/50864085.

Further Reading:
* https://developer.mozilla.org/en-US/docs/Web/API/HTMLIFrameElement
* https://developer.mozilla.org/en-US/docs/Web/API/DocumentOrShadowRoot/activeElement
* https://gist.github.com/jaydson/1780598
* https://javascript.info/cross-window-communication

## Requirements

* ES6 (Let, Const, Default Parameters, Destructuring, Arrow Functions, Array.filter)
