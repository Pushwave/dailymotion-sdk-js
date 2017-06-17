if(!window.DM){DM={_apiKey:null,_session:null,_userStatus:"unknown",_logging:true,_domain:{api:"https://api.dailymotion.com",www:"//www.dailymotion.com",cdn:"//api.dmcdn.net"},_oauth:{logoutUrl:"https://www.dailymotion.com/oauth/logout",authorizeUrl:"https://www.dailymotion.com/oauth/authorize"},copy:function(e,d,b,a){for(var c in d){if(b||typeof e[c]==="undefined"){e[c]=a?a(d[c]):d[c]}}return e},create:function(d,g){var f=window.DM,a=d?d.split("."):[],j=a.length;for(var e=0;e<j;e++){var b=a[e];var h=f[b];if(!h){h=(g&&e+1==j)?g:{};f[b]=h}f=h}return f},provide:function(c,b,a){return DM.copy(typeof c=="string"?DM.create(c):c,b,a)},guid:function(){return"f"+(Math.random()*(1<<30)).toString(16).replace(".","")},log:function(a){if(DM._logging){if(window.Debug&&window.Debug.writeln){window.Debug.writeln(a)}else{if(window.console){window.console.log(a)}}}if(DM.Event){DM.Event.fire("dm.log",a)}},error:function(a){if(window.console){window.console.error(a)}if(DM.Event){DM.Event.fire("dm.error",a)}},$:function(a){if(typeof a=="string"){a=document.getElementById(a)}return a},parseBool:function(a){if(a===true||a===false){return a}if(a===0){return false}if(typeof a=="string"){return !a.match(/^(?:|false|no|off|0)$/i)}return !!a},type:function(e){if(!DM._class2type){DM._class2type={};var d="Boolean Number String Function Array Date RegExp Object".split(" ");for(var c=0,a=d.length;c<a;c++){var b=d[c];DM._class2type["[object "+b+"]"]=b.toLowerCase()}DM._class2type["[object Undefined]"]="undefined"}return e===null?String(e):DM._class2type[Object.prototype.toString.call(e)]||"object"}}}DM.provide("Array",{indexOf:function(a,d){if(a.indexOf){return a.indexOf(d)}var c=a.length;if(c){for(var b=0;b<c;b++){if(a[b]===d){return b}}}return -1},merge:function(c,b){for(var a=0;a<b.length;a++){if(DM.Array.indexOf(c,b[a])<0){c.push(b[a])}}return c},flatten:function(a){for(var b in a){if(a.hasOwnProperty(b)){if(DM.type(a[b])=="array"){a[b]=a[b].join(",")}}}return a},filter:function(c,e){var a=[];for(var d=0;d<c.length;d++){if(e(c[d])){a.push(c[d])}}return a},keys:function(d,c){var a=[];for(var b in d){if(c||d.hasOwnProperty(b)){a.push(b)}}return a},map:function(a,c){var b=[];for(var d=0;d<a.length;d++){b.push(c(a[d]))}return b},forEach:function(f,d,e){if(!f){return}if(Object.prototype.toString.apply(f)==="[object Array]"||(!(f instanceof Function)&&typeof f.length=="number")){if(f.forEach){f.forEach(d)}else{for(var c=0,a=f.length;c<a;c++){d(f[c],c,f)}}}else{for(var b in f){if(e||f.hasOwnProperty(b)){d(f[b],b,f)}}}}});DM.provide("",{player:function(b,a){return DM.Player.create(b,a)}});DM.provide("Player",{_INSTANCES:{},_INTERVAL_ID:null,_PROTOCOL:null,API_MODE:null,EVENT_HANDLERS:{},apiReady:false,autoplay:false,currentTime:0,bufferedTime:0,duration:NaN,seeking:false,error:null,ended:false,muted:false,volume:1,paused:true,fullscreen:false,controls:undefined,rebuffering:false,qualities:[],quality:undefined,subtitles:[],subtitle:undefined,play:function(){this.api("play")},togglePlay:function(){this.api("toggle-play")},pause:function(){this.api("pause")},seek:function(a){this.api("seek",a)},load:function(b,a){this.api("load",b,a)},setMuted:function(a){this.api("muted",a)},toggleMuted:function(){this.api("toggle-muted")},setVolume:function(a){this.api("volume",a)},setQuality:function(a){this.api("quality",a)},setSubtitle:function(a){this.api("subtitle",a)},setFullscreen:function(a){this.api("fullscreen",a)},setControls:function(a){this.api("controls",a)},toggleControls:function(){this.api("toggle-controls")},setProp:function(){this.api.apply(this,["set-prop"].concat([].slice.call(arguments)))},watchOnSite:function(a){this.api("watch-on-site")},api:function(b){var a=(2<=arguments.length)?[].slice.call(arguments,1):[];this._send(b,a)},create:function(c,b){c=DM.$(c);if(!c||c.nodeType!=1){throw new Error("Invalid first argument sent to DM.player(), requires a HTML element or element id: "+c)}if(!b||typeof b!="object"){throw new Error("Missing `options' parameter for DM.player()")}b=DM.copy(b,{width:480,height:270,title:"video player",params:{},events:{}});if(location.search.length>1&&location.search.indexOf("dm:params")!==-1){var d=DM.QS.decode(location.search.substr(1));if("dm:params" in d){b.params=DM.copy(DM.QS.decode(d["dm:params"]),b.params)}}DM._domain.www=DM._domain.www.replace(/^https?\:/,"");DM.Player._PROTOCOL=(window.location&&/^https?:$/.test(window.location.protocol))?window.location.protocol:"http:";c.setAttribute("frameborder","0");c.setAttribute("allowfullscreen","true");c.setAttribute("webkitallowfullscreen","true");c.setAttribute("mozallowfullscreen","true");DM.copy(c,DM.Player);c.init(b.video,b.params);if(typeof b.events=="object"){for(var a in b.events){c.addEventListener(a,b.events[a],false)}}return c},init:function(b,c){var a=this;DM.Player._installHandlers();c=typeof c=="object"?c:{};c.api=DM.Player.API_MODE;if(location.origin){c.origin=location.origin}else{c.origin="*"}if(DM._apiKey){c.apiKey=DM._apiKey}this.id=c.id=this.id?this.id:DM.guid();this.src=DM.Player._PROTOCOL+DM._domain.www+"/embed"+(b?"/video/"+b:"")+"?"+DM.QS.encode(c);if(DM.Player._INSTANCES[this.id]!=this){DM.Player._INSTANCES[this.id]=this;this.addEventListener("unload",function(){delete DM.Player._INSTANCES[this.id]})}this.autoplay=DM.parseBool(c.autoplay)},_installHandlers:function(){if(DM.Player.API_MODE!==null){return}if(window.postMessage){DM.Player.API_MODE="postMessage";var a=function(d){if(!d.origin||d.origin.indexOf(DM.Player._PROTOCOL+DM._domain.www)!==0){return}var c=DM.QS.decode(d.data);if(!c.id||!c.event){return}var b=DM.$(c.id);b._recvEvent(c)};if(window.addEventListener){window.addEventListener("message",a,false)}else{if(window.attachEvent){window.attachEvent("onmessage",a)}}}},_send:function(c,a){if(!this.apiReady){try{if(console&&typeof console.warn==="function"){console.warn('Player not ready. Ignoring command : "'+c+'"')}}catch(b){}return}if(DM.Player.API_MODE=="postMessage"){this.contentWindow.postMessage(JSON.stringify({command:c,parameters:a||[]}),DM.Player._PROTOCOL+DM._domain.www)}},_dispatch:document.createEvent?function(a){var b=document.createEvent("HTMLEvents");b.initEvent(a,true,true);this.dispatchEvent(b)}:function(a){if("on"+a in this){b=document.createEventObject();this.fireEvent("on"+a,b)}else{if(a in this.EVENT_HANDLERS){var b={type:a,target:this};DM.Array.forEach(this.EVENT_HANDLERS[a],function(c){c(b)})}}},_recvEvent:function(a){switch(a.event){case"apiready":if(this.apiReady){return}else{this.apiReady=true}break;case"start":this.ended=false;break;case"loadedmetadata":this.error=null;break;case"timeupdate":case"ad_timeupdate":this.currentTime=parseFloat(a.time);break;case"progress":this.bufferedTime=parseFloat(a.time);break;case"durationchange":this.duration=parseFloat(a.duration);break;case"seeking":this.seeking=true;this.currentTime=parseFloat(a.time);break;case"seeked":this.seeking=false;this.currentTime=parseFloat(a.time);break;case"fullscreenchange":this.fullscreen=DM.parseBool(a.fullscreen);break;case"controlschange":this.controls=DM.parseBool(a.controls);break;case"volumechange":this.volume=parseFloat(a.volume);this.muted=DM.parseBool(a.muted);break;case"video_start":case"ad_start":case"ad_play":case"playing":case"play":this.paused=false;break;case"end":this.ended=true;break;case"ad_pause":case"ad_end":case"video_end":case"pause":this.paused=true;break;case"error":this.error={code:a.code,title:a.title,message:a.message};break;case"rebuffer":this.rebuffering=DM.parseBool(a.rebuffering);break;case"qualitiesavailable":this.qualities=a.qualities;break;case"qualitychange":this.quality=a.quality;break;case"subtitlesavailable":this.subtitles=a.subtitles;break;case"subtitlechange":this.subtitle=a.subtitle;break}this._dispatch(a.event)},addEventListener:function(b,c,a){if("on"+b in this&&this.attachEvent){this.attachEvent("on"+b,c,a)}else{if(!(b in this.EVENT_HANDLERS)){this.EVENT_HANDLERS[b]=[]}this.EVENT_HANDLERS[b].push(c)}}});window.setTimeout(function(){if(window.dmAsyncInit){dmAsyncInit()}},0);DM.provide("QS",{encode:function(d,a,b){a=a===undefined?"&":a;b=b===false?function(e){return e}:encodeURIComponent;var c=[];DM.Array.forEach(d,function(f,e){if(f!==null&&typeof f!="undefined"){c.push(b(e)+"="+b(f))}});c.sort();return c.join(a)},decode:function(h){var d=decodeURIComponent,g={},c=h.split("&"),b,f,a,e;for(b=0;b<c.length;b++){f=c[b].split("=",2);if(f&&f[0]){a=d(f[0]);e=f[1]?d(f[1].replace(/\+/g,"%20")):"";if(/\[\]$/.test(a)){a=a.slice(0,-2);(g[a]?g[a]:g[a]=[]).push(e)}else{g[a]=e}}}return g}});