# iFrame Focus Tracker

Can't attach event listeners to a cross domain `<iframe>` element and totally BUMMED? You wanted to track interactions with your Youtube embed or some form embed, but ran into issues? Trying to send Analytics events for iframe interactions?
  
Me too.

## How to Use

Use the ift.track() function to declare iframe elements you wish to track interaction for. ift.track takes 3 arguments:
1. CSS Selector for the element to track (string) - Selector to use to grab the element, anything that works with document.querySelector.
2. Callback (function) - A function to be executed when the tracked element gets focus, will be passed the tracked element as the first parameter
3. Whether to track once (boolean) - Default is false. If set to true, it will only track the focus event the first time it happens and execute the callback only once.

Example: 
``` 
  // consider whether you need to listen for the document to be ready before initiating tracking 
  // track an iframe element with a class="thingy" and log the class when interacted with, but only on the first time
  ift.track('.thingy', (thingy)=>{console.log(thingy.className);}, true);
```  

## How it Works

This checks if the `window` object has focus. If it loses focus, that means the user has shifted focus to an iframe element.

Based on this answer https://stackoverflow.com/a/50864085.

Further Reading:
https://developer.mozilla.org/en-US/docs/Web/API/HTMLIFrameElement
https://developer.mozilla.org/en-US/docs/Web/API/DocumentOrShadowRoot/activeElement
https://gist.github.com/jaydson/1780598
https://javascript.info/cross-window-communication
