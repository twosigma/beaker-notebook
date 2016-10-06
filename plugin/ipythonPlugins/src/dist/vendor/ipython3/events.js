// Copyright (c) IPython Development Team.
// Distributed under the terms of the Modified BSD License.

// Give us an object to bind all events to. This object should be created
// before all other objects so it exists when others register event handlers.
// To register an event handler:
//
// require(['base/js/events'], function (events) {
//     events.on("event.Namespace", function () { do_stuff(); });
// });

define('ipython3_events', ['ipython3_namespace'], function (IPython) {
    "use strict";

    var Events = function () {};
    
    var events = new Events();
    
    // Backwards compatability.
    IPython.Events = Events;
    IPython.events = events;
    
    return $([events]);
});
