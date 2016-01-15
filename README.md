Points.js
==============

A [pointer events][1] polyfill, allowing you to listen to the following events as described in the [W3C Pointer Events Specification proposal][2]:

* pointerdown
* pointerup
* pointermove
* pointerover
* pointerout
* pointerenter
* pointerleave
* pointercancel

The idea is to abstract away the differences between mouse and touch (and pen) events, to reduce the developer effort required to support multiple input types. Currently, without a polyfill, only IE10 supports these events (in prefixed form), but it looks as though they will gain wider adoption.


Usage
-----

* Include `Points.js` somewhere on your page
* Add a CSS `touch-action` property of `none` to elements you want to receive pointer events (not actually necessary &ndash; see the section on `touch-action` below &ndash; but recommended)
* That's it.


What's wrong with the existing polyfills?
-----------------------------------------

There's already a few (or more? let me know!) pointer events polyfills out there:

* [polymer/PointerEvents][5]
* [Hand.js][3]
* [Pointer.js][6]

However as far as I can tell, they don't quite adhere to the spec, especially with touch devices. (Currently, neither does this one, but in different ways - see next section!). Hand.js double-fires events because it 'translates' both touch events **and** the compatibility mouse events that mobile browsers fire *after* those touch events, and the other two don't fire `pointerenter` and `pointerleave` events.

All three fail to fire `pointermove` events on an element (or `pointerover/out/enter/leave` events) in a touch context if the initial `pointerdown` occurred outside that element.

This isn't to disparage these polyfills - merely to explain why I've bothered to create a new one. There are almost certainly things that they've got right and I've got wrong. Hopefully, between us, we can get it completely right.


Limitations
-----------

* Disregards the `touch-action` CSS property. This is nigh on impossible to implement well across browsers without introducing performance penalties. For now, just use `event.preventDefault()` like you're used to (see the section on `touch-action` below), but use the CSS property to be future-proof.
* Properties such as `tiltX`, `tiltY` and `pressure` are incorrect. `tiltX` and `tiltY` are both 0, `pressure` is 0.5 (0 for mouse pointer with no buttons down), unless you are in Firefox and using a device that reports `mozPressure`. `width` and `height` are 20 for touch events - a reasonable estimate of how fat people's fingers are.
* No support for `gotpointercapture` and `lostpointercapture` yet.
* `pointerdown` and `pointerup` events are fired whenever a mouse button is pressed or released - strictly speaking, they should only be fired when the mouse enters or leaves the 'active buttons state', i.e. if a second button is pressed, it shouldn't trigger a second `pointerdown` event.


Performance
-----------

This polyfill works slightly differently to the others - whereas they generally work by intercepting calls to `addEventListener`, this one works by listening to intercepting mouse and touch events at the `window` level, and firing the corresponding pointer events on the *intended target*.

In the case of touch events the intended target may not be the same as the *touch target*, because the target of a touch is whatever was under the finger when you first put it on the screen, not what's under it now, which is at odds with the pointer events spec. The only way to discover the intended target is with `document.elementFromPoint( touch.clientX, touch.clientY )`, so that's what we do.

This approach allows us to adhere to the spec more closely than polyfills that use the interception approach. There is a theoretical performance implication that you should be aware of - generating fake events and using `document.elementFromPoint` is not free, though in practice the impact is negligible.

However there is another performance consideration. Ordinarily, on touch devices, the document will begin to scroll as soon as your finger drags the surface - this happens on a separate thread to the main JavaScript thread, which makes it snappy and responsive even if a lot of stuff is going on.

Unless, that is, the element under your finger (or one of its ancestors) has one or more touch event handlers bound to it, in which case the browser cannot begin scrolling until it has determined whether any of those handlers call `preventDefault()` on the event.

With Points.js, because `window` (ancestor to all elements, as far as the event model is concerned) has touch event handlers bound, the browser cannot implement scrolling on a separate thread. The upshot is that **if there are scrollable areas in your app, scrolling performance will be affected**, depending on how much work the main JavaScript thread has to do.

Rick Byers has a [more detailed explanation here](https://plus.google.com/u/1/115788095648461403871/posts/cmzrtyBYPQc).


The touch-action CSS property
-----------------------------

**tl:dr;** - *`touch-action` doesn't work, use `event.preventDefault()` alongside `touch-action: none` for the time being*

As well as the new events, the [spec][8] introduces `touch-action`, a CSS property which can have a value of `auto` (default), `none`, `pan-x` or `pan-y`. The idea, according to Microsoft's Jacob Rossi (see [this W3Conf video][10] around the 12:50 mark) is to eliminate the need for `event.preventDefault()`, which necessarily introduces lag between the action (dragging a finger) and the behaviour (panning the document) because the browser has to wait to see if any event handlers prevented the default behaviour.

This introduces a couple of problems for polyfillers. Firstly, invalid CSS properties are disregarded, so the only way we can establish whether the author included `touch-action: none` is by requesting and parsing stylesheets ourselves. Hand.js does so when the document first loads, parsing with regex and adding a `handjs_forcePreventDefault` property to all elements matching selectors to which `touch-action: none` is applied, but its approach will fail if:

* The stylesheets are on a different domain, without a valid CORS setup
* There are conflicting rules which need to be interpreted - there is no mechanism for comparing selector specificity
* Per-element styles are used
* Stylesheets are added after `DOMContentLoaded`
* The DOM changes in certain ways (e.g. toggling between active and inactive in the following case: `canvas.active { touch-action: none; } canvas.inactive { touch-action: auto }`)

Polymer's polyfill acknowledges these difficulties and proposes an alternative, namely adding a `touch-action="none"` attribute to nodes that should receive pointer events and using mutation observers where possible to keep track of changes. This is a smart idea, but I'm not sure I like adding a non-standard property to compensate for the lack of a standard property.

Furthermore there is some ambiguity in how `touch-action` is interpreted:

* Hand.js fires pointer events whether `touch-action` is `auto` or `none` (it ignores `pan-x` and `pan-y`), but prevents the default event in the `none` case
* Polymer does **not** fire events when `touch-action` is `auto`, otherwise it fires events and prevents event defaults. It respects the `pan-x` and `pan-y` values. This is potentially problematic since you may want to respond to the user tapping on elements *without* preventing panning/zooming when the user initially touches that element then subsequently drags their finger.
* Pointer.js disregards `touch-action` altogether.

None of these solutions accurately reflect the specification, which (if I'm reading it correctly - it's not the clearest piece of English ever written!) allows user agents to initially dispatch pointer events regardless of `touch-action` but then stop dispatching pointer events (after dispatching a `pointercancel` event) *if the user agent determines it should execute a default behaviour*. Unfortunately, we have no good way of determining whether a default behaviour has been initiated.

Faced with imperfect solutions, I present... no solution. If you want to prevent default behaviour (panning and zooming) on an element, add an event handler and use `event.preventDefault()`, the same way you would with touch events normally. **You should still** use `touch-action: none`, since future browsers may not fire expected pointer events otherwise, depending on how they interpret the spec...

(If anyone has any better ideas, let me know!) 


Questions for the W3C Pointer Events Working Group!
---------------------------------------------------

*Update: Responses from [Rick Byers](https://github.com/RByers), who works on the Chrome team and is part of the working group, below*

* Can `touch-action: auto` override a `touch-action: none` property applied to an ancestor? Should pointer events fire *at all* in a `touch-action: pan-x` situation, or should they only not fire if the user is in fact panning horizontally?
    * *touch-action isn't inherited, so it's not necessary.  A child automatically gets touch-action: auto behavior for itself.*
    * *Pointer events should always fire up until the point a browser action starts (at which point you should get a pointercancel event.  So for pan-x, I'd expect to see pointerdown when the finger touches, some number of pointermove events, then if the user moves far enough in the x direction to trigger a pan, a pointer-cancel.  Instead if the user moves in another direction I'd get all pointer events (and no panning).*
* It's not at all clear how you're supposed to listen to button changes. The [spec][9] says 'Pointer Events do not fire overlapping `pointerdown` and `pointerup` events for chorded button presses ... Instead, chorded button presses can be detected by inspecting changes to the `button` and `buttons` properties'. Inspect how?
    * *The spec says that pointermove must be fired when the button state changes, so that's where you can detect a change.*


Browser support
---------------

Doesn't work in very old browsers (IE8 and below, possibly some early versions of Firefox that no-one uses any more, probably the browser on your Nintendo Wii or your 2007 featurephone). Pull requests welcome!

In the case of IE8 it would probably be fixable - you'd need to polyfill `addEventListener` and `dispatchEvent` in such a way that non-native events are accommodated - most polyfills only support native events like `onmouseover`. The corollary of this is that you'd need to maintain some kind of registry for custom event handlers. If you're having IE problems I feel bad for you son...


Contact
-------

I'm [@rich_harris](http://twitter.com/rich_harris).


Changelog
---------

[is here](CHANGELOG.md).


Projects Using Points
---------------------

https://github.com/benhutchison/gesture


License
-------

Copyright 2013 Rich Harris. Released under the MIT License.


[1]: http://msdn.microsoft.com/en-gb/library/ie/hh673557(v=vs.85).aspx#Gesture_object_events
[2]: https://dvcs.w3.org/hg/pointerevents/raw-file/tip/pointerEvents.html
[3]: http://handjs.codeplex.com/
[4]: http://blogs.msdn.com/b/eternalcoding/archive/2013/01/16/hand-js-a-polyfill-for-supporting-pointer-events-on-every-browser.aspx
[5]: https://github.com/polymer/PointerEvents
[6]: https://github.com/borismus/pointer.js
[7]: https://dvcs.w3.org/hg/pointerevents/raw-file/tip/pointerEvents.html#pointerevent-interface
[8]: https://dvcs.w3.org/hg/pointerevents/raw-file/tip/pointerEvents.html#the-touch-action-css-property
[9]: https://dvcs.w3.org/hg/pointerevents/raw-file/tip/pointerEvents.html#chorded-button-interactions
[10]: https://www.youtube.com/watch?v=SCfVn4JY5yk
