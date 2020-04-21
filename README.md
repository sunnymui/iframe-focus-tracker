# Cross Domain iFrame Focus Tracker

Can't attach event listeners to a cross domain `<iframe>` element and totally BUMMED? You wanted to track interactions with your Youtube embed, social media like button, or some form embed, but ran into issues? Trying to send Analytics events for iframe interactions?
  
Me too.

## How to Use

#### ift.track()

Use the `ift.track()` function to declare the iframe element you wish to track interaction for. `ift.track` takes 3 arguments:

1. CSS Selector for the element to track (string) - Selector to use to grab the element, anything that works with document.querySelector.
2. Callback (function) - A function to be executed when the tracked element gets focus, will be passed the tracked element as the first parameter. Default: Empty anonymous function.
3. Configuration Options (object) - An optional object containing configuration options. You don't have to create the whole config object again to customize just one option, any options missing will have the defaults applied:
  - Once (bool) - Should we only track the first interaction with the iframe? Thus, callback will only run once. Default: false
  - Form (bool) - Is this a form or complex structure requiring input that returning focus to the window would mess up? Setting to true will turn off window refocusing after interaction which also disables sequential clicks in the iframes. Only applies to the element this is set for. Default: false
  - Start (int) - After how many focus events/interactions with this element should we start running the callback? Useful for when a script generated iframe creates focus on the iframe while it creates the element and you have tracking set to once. Default: 0

Example: 
``` 
  // consider whether you need to listen for the document to be ready before initiating tracking
  
  // track an iframe element with a class="thingy" and log the class when interacted with, but only on the first time
  ift.track('.thingy', (thingy) => {console.log(thingy.className);}, {once: true});
  
  // track an iframe element with a form with a class="thingy" and log the class when interacted with
  // form option must be set to true if you want the form to be usable!
  ift.track('.thingy', (thingy) => {console.log(thingy.className);}, {form: true});
``` 

Given this HTML:
```
  <iframe class="thingy" src="https://someiframeurl.com" width="100%" height="500px" frameborder="0"></iframe>
```

#### ift.ifReady()

Use the `ift.ifReady()` function to wrap your tracking function and ensure the iframe is has finished loading and is ready to attach trackers to in the DOM. `ift.ready` takes 2 arguments:

1. Selector (string) - The css selector for the iframe to monitor in the DOM until it has fully loaded (fired the 'load' event). This can be an existing iframe element or an element that is not in the DOM yet, but will be added dynamically or asynchronously.
2. Callback (function) - The callback function to run once the iframe has fired the 'load' event. Typically would be an anonymous function which you put your ift.track function inside of. This function is passed the Selector string as an argument.

Example:
```
// wait for iframe to be added to the DOM and finish loading, then log a console message when clicked 
// default options are set when no config object passed ({once: false, form: false})
ift.ifReady('#iframe-container iframe', (selector)=>{
  ift.track(selector, () => console.log('iframe clicked'));
});
```

Given this HTML:
```
  <div id="iframe-container"></div>
  <script>
  const iframe = document.createElement('iframe');
  const html = '<body>Foo</body>';
  iframe.srcdoc = html;
  iframe.sandbox = '';
  document.querySelector('#iframe-container').append(iframe);
  </script>
```

### Sample Real Life Usage

Here's an example using it to track an interaction with an embedded form and sending that data to Google Analytics as an event:
```
function ga_embed_event_handler(element){
    if (ga){
        ga('send', 'event', 'Maker Register Form', 'interaction', 'Maker Page - Maker register form interacted with');
    }
}

const embed_selector = '#maker-register';

// wait for maker register form load event to fire before tracking
ift.ifReady(embed_selector, (selector)=>{
  ift.track(selector, ga_embed_event_handler, {once: true, form: true});
});
```

Have several iframes to track on the page? You can do something like this:
```
const elements = [{
  selector: '#give-map',
  handler: ga_map_event_handler
}, {
  selector: '.airtable-embed',
  handler: ga_assist_event_handler
}, {
... etc more
}];

elements.forEach((current, i) => {
  const iframe = document.querySelector(current.selector);
  ift.track(current.selector, current.handler, true);
});
```

### ES6 Module Usage

If you want to be super modern, you can use the `ift-es6-module.js` file as an ES6 module you can import into your html. Only usable in modern browsers, read more at: [https://caniuse.com/#feat=es6-module](https://caniuse.com/#feat=es6-module)

Example:

```
<script type="module">
      import * as ift from './ift-es6-module.js';

      ift.track('#hello',()=>{
        console.log('hello');
      });

</script>
``` 

Or as an external script:

HTML:
```
<script type="module" src="app.js"></script>
```
JS:
```
// in your main app.js file import the ift module file
import * as ift from './ift-es6-module.js';

      ift.track('#hello',()=>{
        console.log('hello');
      });

```

## Caveats

*This only tracks each time focus changes from the window to the iframe, so it can't detect anything about what you are clicking on inside the iframe, just that the iframe itself has been interacted with*

If you try to directly use a console.log as the callback it won't work, you need to wrap it in an anonymous function.

Attaching multiple trackers to the same iframe element--say you want a callback that happens once and one to happen for every interactions--is possible, but not fully supported (some caveats). Attach the tracker that runs once first, then the tracker that runs multiple times after. The run-once tracker will run first, then the multiple-time tracker will run on every subsequent time. This is because it matches the first possible tracker in the tracking list. If you want both functions to run, you'll have to wrap both in a function and have a variable to track when a function has already run.

#### Form + Other Embeds on the Same Page

If you have a iframe form embed and a simple iframe button embed, clicking on the form iframe then clicking directly on the button iframe right after won't register the interaction with the button. You have to manually click back in the window before interactions with other iframes will be tracked.

This is because the `form: true` option disables automatic window refocusing after a click in an iframe element so users are able to type things into the form. Remember, this tracker only detects when focus changes from the window, so if you click from one iframe to another iframe, you will never have a focus change from the window.

## How it Works

This checks if the `window` object has focus. If it loses focus, that means the user has shifted focus to an iframe element. Every time you move from window -> iframe, it'll track the event. Different iframes are differentiated by comparing the current active element to cached versions. When focus is moved to an iframe, a `setTimeout` call with a window focusing callback will be set so focus will be reset at the end of current JS execution and subsequent clicks--either on the same iframe or other iframes--will be tracked.

Based on this answer https://stackoverflow.com/a/50864085.

## Further Reading:

* https://developer.mozilla.org/en-US/docs/Web/API/HTMLIFrameElement
* https://developer.mozilla.org/en-US/docs/Web/API/DocumentOrShadowRoot/activeElement
* https://gist.github.com/jaydson/1780598
* https://javascript.info/cross-window-communication

## Requirements

* ES6 (Let, Const, Default Parameters, Destructuring, Arrow Functions, Array.filter, Array, reduce, spread operator, Promises, requestAnimationFrame, Modules {if you use the es6 module file}), Object literal shorthand
* HTML5 (HTMLElement.focus() web api)
