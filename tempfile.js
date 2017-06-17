/**
 * Highly inspired from Facebook connect JS SDK available at https://github.com/facebook/connect-js
 *
 * Copyright Dailymotion S.A.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 *
 *
 * @provides dm.prelude
 */

/**
 * Prelude.
 *
 *     Namespaces are one honking great idea -- let's do more of those!
 *                                                            -- Tim Peters
 *
 * The Prelude is what keeps us from being messy. In order to co-exist with
 * arbitary environments, we need to control our footprint. The one and only
 * rule to follow here is that we need to limit the globals we introduce. The
 * only global we should every have is ``dm``. This is exactly what the prelude
 * enables us to do.
 *
 * The main method to take away from this file is `DM.copy()`_. As the name
 * suggests it copies things. Its powerful -- but to get started you only need
 * to know that this is what you use when you are augmenting the DM object. For
 * example, this is skeleton for how ``DM.Event`` is defined::
 *
 *   DM.provide('Event', {
 *     subscribe: function() { ... },
 *     unsubscribe: function() { ... },
 *     fire: function() { ... }
 *   });
 *
 * This is similar to saying::
 *
 *   DM.Event = {
 *     subscribe: function() { ... },
 *     unsubscribe: function() { ... },
 *     fire: function() { ... }
 *   };
 *
 * Except it does some housekeeping, prevents redefinition by default and other
 * goodness.
 *
 * .. _DM.copy(): #method_DM.copy
 *
 * @class DM
 * @static
 * @access private
 */
if (!window.DM)
{
    DM =
    {
        // use the init method to set these values correctly
        _apiKey: null,
        _session: null,
        _userStatus: 'unknown', // or 'notConnected' or 'connected'

        // logging is enabled by default. this is the logging shown to the
        // developer and not at all noisy.
        _logging: true,

        _domain:
        {
            api: 'https://api.dailymotion.com',
            www: '//www.dailymotion.com',
            cdn: '//api.dmcdn.net'
        },
        _oauth:
        {
            logoutUrl: 'https://www.dailymotion.com/oauth/logout',
            authorizeUrl: 'https://www.dailymotion.com/oauth/authorize'
        },

        /**
         * Copies things from source into target.
         *
         * @access private
         * @param target    {Object}  the target object where things will be copied
         *                            into
         * @param source    {Object}  the source object where things will be copied
         *                            from
         * @param overwrite {Boolean} indicate if existing items should be
         *                            overwritten
         * @param tranform  {function} [Optional], transformation function for
         *        each item
         */
        copy: function(target, source, overwrite, transform)
        {
            for (var key in source)
            {
                if (overwrite || typeof target[key] === 'undefined')
                {
                    target[key] = transform ? transform(source[key]) : source[key];
                }
            }
            return target;
        },

        /**
         * Create a namespaced object.
         *
         * @access private
         * @param name {String} full qualified name ('Util.foo', etc.)
         * @param value {Object} value to set. Default value is {}. [Optional]
         * @return {Object} The created object
         */
        create: function(name, value)
        {
            var node = window.DM, // We will use 'DM' as root namespace
                nameParts = name ? name.split('.') : [],
                c = nameParts.length;
            for (var i = 0; i < c; i++)
            {
                var part = nameParts[i];
                var nso = node[part];
                if (!nso)
                {
                    nso = (value && i + 1 == c) ? value : {};
                    node[part] = nso;
                }
                node = nso;
            }
            return node;
        },

        /**
         * Copy stuff from one object to the specified namespace that
         * is DM.<target>.
         * If the namespace target doesn't exist, it will be created automatically.
         *
         * @access private
         * @param target    {Object|String}  the target object to copy into
         * @param source    {Object}         the source object to copy from
         * @param overwrite {Boolean}        indicate if we should overwrite
         * @return {Object} the *same* target object back
         */
        provide: function(target, source, overwrite)
        {
            // a string means a dot separated object that gets appended to, or created
            return DM.copy
            (
                typeof target == 'string' ? DM.create(target) : target,
                source,
                overwrite
            );
        },

        /**
         * Generates a weak random ID.
         *
         * @access private
         * @return {String} a random ID
         */
        guid: function()
        {
            return 'f' + (Math.random() * (1<<30)).toString(16).replace('.', '');
        },

        /**
         * Logs a message for the developer if logging is on.
         *
         * @access private
         * @param args {Object} the thing to log
         */
        log: function(args)
        {
            if (DM._logging)
            {
//#JSCOVERAGE_IF 0
                if (window.Debug && window.Debug.writeln)
                {
                    window.Debug.writeln(args);
                }
                else if (window.console)
                {
                    window.console.log(args);
                }
//#JSCOVERAGE_ENDIF
            }

            // fire an event if the event system is available
            if (DM.Event)
            {
                DM.Event.fire('dm.log', args);
            }
        },

        /**
         * Logs an error message for the developer.
         *
         * @access private
         * @param args {Object} the thing to log
         */
        error: function(args)
        {
//#JSCOVERAGE_IF 0
            if (window.console)
            {
                window.console.error(args);
            }
//#JSCOVERAGE_ENDIF

            // fire an event if the event system is available
            if (DM.Event)
            {
                DM.Event.fire('dm.error', args);
            }
        },

        /**
         * Shortcut for document.getElementById
         * @method $
         * @param {string} DOM id
         * @return DOMElement
         * @access private
         */
        $: function(element)
        {
            if (typeof element == "string")
            {
                element = document.getElementById(element);
            }
            return element;
        },

        parseBool: function(value)
        {
            if (value === true || value === false) return value;
            if (value === 0) return false;
            if (typeof value == 'string') return !value.match(/^(?:|false|no|off|0)$/i);
            return !!value;
        },

        type: function(obj)
        {
            if (!DM._class2type)
            {
                DM._class2type = {};
                var classes = 'Boolean Number String Function Array Date RegExp Object'.split(' ');
                for (var i = 0, l = classes.length; i < l; i++)
                {
                    var name = classes[i];
                    DM._class2type['[object ' + name + ']'] = name.toLowerCase();
                }
                DM._class2type['[object Undefined]'] = 'undefined';
            }
            return obj === null ? String(obj) : DM._class2type[Object.prototype.toString.call(obj)] || "object";
        }
    };
}
/**
 * Highly inspired from Facebook connect JS SDK available at https://github.com/facebook/connect-js
 *
 * Copyright Dailymotion S.A.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @provides dm.array
 * @layer basic
 * @requires dm.prelude
 */

/**
 * Array related helper methods.
 *
 * @class dm.Array
 * @private
 * @static
 */
DM.provide('Array',
{
    /**
     * Get index of item inside an array. Return's -1 if element is not found.
     *
     * @param arr {Array} Array to look through.
     * @param item {Object} Item to locate.
     * @return {Number} Index of item.
     */
    indexOf: function (arr, item)
    {
        if (arr.indexOf)
        {
            return arr.indexOf(item);
        }
        var length = arr.length;
        if (length)
        {
            for (var index = 0; index < length; index++)
            {
                if (arr[index] === item)
                {
                    return index;
                }
            }
        }
        return -1;
    },

    /**
     * Merge items from source into target, but only if they dont exist. Returns
     * the target array back.
     *
     * @param target {Array} Target array.
     * @param source {Array} Source array.
     * @return {Array} Merged array.
     */
    merge: function(target, source)
    {
        for (var i = 0; i < source.length; i++)
        {
            if (DM.Array.indexOf(target, source[i]) < 0)
            {
                target.push(source[i]);
            }
        }
        return target;
    },

    /**
     * flatten arrays of strings in obj to one string concatenated with comma.
     *
     * @param arr {Object} Object to flatten.
     * @return {Object} Flattened object.
     */
    flatten: function(obj)
    {
        for (var param in obj)
        {
            if (obj.hasOwnProperty(param))
            {
                if (DM.type(obj[param]) == 'array')
                {
                    obj[param] = obj[param].join(',');
                }
            }
        }
        return obj;
    },

    /**
     * Create an new array from the given array and a filter function.
     *
     * @param arr {Array} Source array.
     * @param fn {Function} Filter callback function.
     * @return {Array} Filtered array.
     */
    filter: function(arr, fn)
    {
        var b = [];
        for (var i = 0; i < arr.length; i++)
        {
            if (fn(arr[i]))
            {
                b.push(arr[i]);
            }
        }
        return b;
    },

    /**
     * Create an array from the keys in an object.
     *
     * Example: keys({'x': 2, 'y': 3'}) returns ['x', 'y']
     *
     * @param obj {Object} Source object.
     * @param proto {Boolean} Specify true to include inherited properties.
     * @return {Array} The array of keys.
     */
    keys: function(obj, proto)
    {
        var arr = [];
        for (var key in obj)
        {
            if (proto || obj.hasOwnProperty(key))
            {
                arr.push(key);
            }
        }
        return arr;
    },

    /**
     * Create an array by performing transformation on the items in a source
     * array.
     *
     * @param arr {Array} Source array.
     * @param transform {Function} Transformation function.
     * @return {Array} The transformed array.
     */
    map: function(arr, transform)
    {
        var ret = [];
        for (var i = 0; i < arr.length; i++)
        {
            ret.push(transform(arr[i]));
        }
        return ret;
    },

    /**
     * For looping through Arrays and Objects.
     *
     * @param {Object} item   an Array or an Object
     * @param {Function} fn   the callback function for iteration.
     *    The function will be pass (value, [index/key], item) paramters
     * @param {Bool} proto  indicate if properties from the prototype should
     *                      be included
     *
     */
    forEach: function(item, fn, proto)
    {
        if (!item)
        {
            return;
        }

        if (Object.prototype.toString.apply(item) === '[object Array]'
            || (!(item instanceof Function) && typeof item.length == 'number'))
        {
            if (item.forEach)
            {
                item.forEach(fn);
            }
            else
            {
                for (var i = 0, l = item.length; i < l; i++)
                {
                    fn(item[i], i, item);
                }
            }
        }
        else
        {
            for (var key in item)
            {
                if (proto || item.hasOwnProperty(key))
                {
                    fn(item[key], key, item);
                }
            }
        }
    }
});
/**
 * Copyright Dailymotion S.A.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @provides dm.player
 * @requires dm.prelude
 *           dm.qs
 */

/**
 * Dailymotion Player.
 *
 * @class dm
 * @static
 * @access private
 */
DM.provide('',
{
    player: function(element, options)
    {
        return DM.Player.create(element, options);
    }
});

/**
 * The Player object.
 *
 * @class DM.Player
 * @access private
 */
DM.provide('Player',
{
    _INSTANCES: {},
    _INTERVAL_ID: null,
    _PROTOCOL: null,
    API_MODE: null,
    EVENT_HANDLERS: {},

    // video properties
    apiReady: false,
    autoplay: false,
    currentTime: 0,
    bufferedTime: 0,
    duration: NaN,
    seeking: false,
    error: null,
    ended: false,
    muted: false,
    volume: 1,
    paused: true,
    fullscreen: false,
    controls: undefined,
    rebuffering: false,
    qualities: [],
    quality: undefined,
    subtitles: [],
    subtitle: undefined,

    play: function() {this.api('play');},
    togglePlay: function() {this.api('toggle-play');},
    pause: function() {this.api('pause');},
    seek: function(time) {this.api('seek', time);},
    load: function(id, settings) {this.api('load', id, settings);},
    setMuted: function(muted) {this.api('muted', muted);},
    toggleMuted: function() {this.api('toggle-muted');},
    setVolume: function(volume) {this.api('volume', volume);},
    setQuality: function(quality) {this.api('quality', quality);},
    setSubtitle: function(subtitle) {this.api('subtitle', subtitle);},
    setFullscreen: function(fullscreen) {this.api('fullscreen', fullscreen);},
    setControls: function (visible) { this.api('controls', visible);},
    toggleControls: function () { this.api('toggle-controls');},
    setProp: function() {this.api.apply(this, ['set-prop'].concat([].slice.call(arguments)));}, // onsite use only
    watchOnSite: function(muted) {this.api('watch-on-site');},

    api: function(command)
    {
        var parameters = (2 <= arguments.length) ? [].slice.call(arguments, 1) : [];
        this._send(command, parameters);
    },

    create: function(element, options)
    {
        element = DM.$(element);
        if (!element || element.nodeType != 1)
            throw new Error("Invalid first argument sent to DM.player(), requires a HTML element or element id: " + element);
        if (!options || typeof options != 'object')
            throw new Error("Missing `options' parameter for DM.player()");

        options = DM.copy(options,
        {
            width: 480,
            height: 270,
            title: "video player",
            params: {},
            events: {}
        });

        // Look at query-string for a "dm:params" parameter, and pass them to the player
        if (location.search.length > 1 && location.search.indexOf('dm:params') !== -1)
        {
            var params = DM.QS.decode(location.search.substr(1));
            if ('dm:params' in params)
            {
                // Decode the double encoded params
                options.params = DM.copy(DM.QS.decode(params['dm:params']), options.params);
            }
        }

        // see #5 : _domain.www should be protocol independent
        // remove protocol from existing value to preserve backward compatibility
        DM._domain.www = DM._domain.www.replace(/^https?\:/, '');
        DM.Player._PROTOCOL = (window.location && /^https?:$/.test(window.location.protocol)) ? window.location.protocol : 'http:';

        element.setAttribute("frameborder", "0");
        element.setAttribute("allowfullscreen", "true");
        element.setAttribute("webkitallowfullscreen", "true");
        element.setAttribute("mozallowfullscreen", "true");

        DM.copy(element, DM.Player);

        element.init(options.video, options.params);

        if (typeof options.events == "object")
        {
            for (var name in options.events)
            {
                element.addEventListener(name, options.events[name], false);
            }
        }

        return element;
    },

    init: function(video, params)
    {
        var self = this;
        DM.Player._installHandlers();
        params = typeof params == "object" ? params : {};
        params.api = DM.Player.API_MODE;

        // Support for old browser without location.origin
        if (location.origin)
            params.origin = location.origin;
        else
            params.origin = '*';

        if (DM._apiKey)
        {
            params.apiKey = DM._apiKey;
        }
        this.id = params.id = this.id ? this.id : DM.guid();
        this.src = DM.Player._PROTOCOL + DM._domain.www + "/embed" + (video ? "/video/" + video : "") + '?' + DM.QS.encode(params);
        if (DM.Player._INSTANCES[this.id] != this)
        {
            DM.Player._INSTANCES[this.id] = this;
            this.addEventListener('unload', function() {delete DM.Player._INSTANCES[this.id];});
        }

        this.autoplay = DM.parseBool(params.autoplay);
    },

    _installHandlers: function()
    {
        if (DM.Player.API_MODE !== null) return;
        if (window.postMessage)
        {
            DM.Player.API_MODE = "postMessage";

            var handler = function(e)
            {
                if (!e.origin || e.origin.indexOf(DM.Player._PROTOCOL + DM._domain.www) !== 0) return;
                var event = DM.QS.decode(e.data);
                if (!event.id || !event.event) return;
                var player = DM.$(event.id);
                player._recvEvent(event);
            };
            if (window.addEventListener) window.addEventListener("message", handler, false);
            else if (window.attachEvent) window.attachEvent("onmessage", handler);
        }
    },

    _send: function(command, parameters)
    {
        if (!this.apiReady) {
            try {
                if (console && typeof console.warn === 'function') {
                    console.warn('Player not ready. Ignoring command : "'+command+'"');
                }
            } catch (e) {}
            return;
        }
        if (DM.Player.API_MODE == 'postMessage')
        {
            this.contentWindow.postMessage(JSON.stringify({
                command    : command,
                parameters : parameters || []
            }), DM.Player._PROTOCOL + DM._domain.www);
        }
    },

    _dispatch: document.createEvent ? function(type)
    {
        var e = document.createEvent("HTMLEvents");
        e.initEvent(type, true, true);
        this.dispatchEvent(e);
    }
    : function(type) // IE compat
    {
        if ('on' + type in this)
        {
            e = document.createEventObject();
            this.fireEvent('on' + type, e);
        }
        else if (type in this.EVENT_HANDLERS)
        {
            var e = {type: type, target: this};
            DM.Array.forEach(this.EVENT_HANDLERS[type], function(handler)
            {
                handler(e);
            });
        }
    },

    _recvEvent: function(event)
    {
        switch (event.event)
        {
            case 'apiready': if (this.apiReady) return /* dispatch only once */; else this.apiReady = true; break;
            case 'start': this.ended = false; break;
            case 'loadedmetadata': this.error = null; break;
            case 'timeupdate': // no break statement here
            case 'ad_timeupdate': this.currentTime = parseFloat(event.time); break;
            case 'progress': this.bufferedTime = parseFloat(event.time); break;
            case 'durationchange': this.duration = parseFloat(event.duration); break;
            case 'seeking': this.seeking = true; this.currentTime = parseFloat(event.time); break;
            case 'seeked': this.seeking = false; this.currentTime = parseFloat(event.time); break;
            case 'fullscreenchange': this.fullscreen = DM.parseBool(event.fullscreen); break;
            case 'controlschange': this.controls = DM.parseBool(event.controls); break;
            case 'volumechange': this.volume = parseFloat(event.volume); this.muted = DM.parseBool(event.muted); break;
            case 'video_start':
            case 'ad_start':
            case 'ad_play':
            case 'playing':
            case 'play': this.paused = false; break;
            case 'end': this.ended = true; break; // no break, also set paused
            case 'ad_pause':
            case 'ad_end':
            case 'video_end':
            case 'pause': this.paused = true; break;
            case 'error': this.error = {code: event.code, title: event.title, message: event.message}; break;
            case 'rebuffer': this.rebuffering = DM.parseBool(event.rebuffering); break;
            case 'qualitiesavailable': this.qualities = event.qualities; break;
            case 'qualitychange': this.quality = event.quality; break;
            case 'subtitlesavailable': this.subtitles = event.subtitles; break;
            case 'subtitlechange': this.subtitle = event.subtitle; break;
        }

        this._dispatch(event.event);
    },

    // IE compat (DM.copy won't set this if already defined)
    addEventListener: function(name, callback, capture)
    {
        if ('on' + name in this && this.attachEvent)
        {
            this.attachEvent("on" + name, callback, capture);
        }
        else
        {
            if (!(name in this.EVENT_HANDLERS))
            {
                this.EVENT_HANDLERS[name] = [];
            }
            this.EVENT_HANDLERS[name].push(callback);
        }
    }
});
// this is useful when the library is being loaded asynchronously
//
// we do it in a setTimeout to wait until the current event loop as finished.
// this allows potential library code being included below this block (possible
// when being served from an automatically combined version)
window.setTimeout(function() { if (window.dmAsyncInit) { dmAsyncInit(); }}, 0);
/**
 * Highly inspired from Facebook connect JS SDK available at https://github.com/facebook/connect-js
 *
 * Copyright Dailymotion S.A.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 *
 *
 * @provides dm.qs
 * @requires dm.prelude dm.array
 */

/**
 * Query String encoding & decoding.
 *
 * @class DM.QS
 * @static
 * @access private
 */
DM.provide('QS',
{
    /**
     * Encode parameters to a query string.
     *
     * @access private
     * @param   params {Object}  the parameters to encode
     * @param   sep    {String}  the separator string (defaults to '&')
     * @param   encode {Boolean} indicate if the key/value should be URI encoded
     * @return         {String}  the query string
     */
    encode: function(params, sep, encode)
    {
        sep = sep === undefined ? '&' : sep;
        encode = encode === false ? function(s) {return s;} : encodeURIComponent;

        var pairs = [];
        DM.Array.forEach(params, function(val, key)
        {
            if (val !== null && typeof val != 'undefined')
            {
                pairs.push(encode(key) + '=' + encode(val));
            }
        });
        pairs.sort();
        return pairs.join(sep);
    },

    /**
     * Decode a query string into a parameters object.
     *
     * @access private
     * @param   str {String} the query string
     * @return      {Object} the parameters to encode
     */
    decode: function(str)
    {
        var decode = decodeURIComponent,
            params = {},
            parts  = str.split('&'),
            i,
            pair,
            key,
            val;

        for (i = 0; i < parts.length; i++)
        {
            pair = parts[i].split('=', 2);
            if (pair && pair[0])
            {
                key = decode(pair[0]);
                val = pair[1] ? decode(pair[1].replace(/\+/g, '%20')) : '';
                if (/\[\]$/.test(key))
                {
                    key = key.slice(0,-2);
                    (params[key] ? params[key] : params[key] = []).push(val);
                }
                else
                {
                    params[key] = val;
                }
            }
        }

        return params;
    }
});
