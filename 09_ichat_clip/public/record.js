(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
require('whammy');
document.addEventListener('DOMContentLoaded', (function() {
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
  window.URL = window.URL || window.webkitURL;
  window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;
  window.cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame;
  navigator.getUserMedia({
    audio: false,
    video: {mandatory: {
        minWidth: 1024,
        maxWidth: 1920,
        minHeight: 576,
        maxHeight: 1080
      }}
  }, (function(stream) {
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var video = document.createElement('video');
    video.src = URL.createObjectURL(stream);
    video.muted = true;
    video.play();
    var frames = [];
    var whammyVideo = new Whammy.Video();
    var drawTimeout;
    video.addEventListener('canplay', (function() {
      setTimeout((function() {
        cancelAnimationFrame(drawTimeout);
        stream.getTracks()[0].stop();
        whammyVideo.frames = frames.slice(0);
        var blob = whammyVideo.compile();
        var xhr = new XMLHttpRequest();
        xhr.onload = (function() {
          alert('OK!');
        });
        xhr.open('POST', 'saveRecording', true);
        xhr.send(blob);
      }), 5000);
      var lastTime = new Date().getTime();
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      function draw() {
        var duration = new Date().getTime() - lastTime;
        lastTime = new Date().getTime();
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        frames.push({
          duration: duration,
          image: canvas.toDataURL('image/webp', 0.8)
        });
        drawTimeout = requestAnimationFrame(draw);
      }
      drawTimeout = requestAnimationFrame(draw);
    }));
  }), function(err) {
    console.log("The following error occured: " + err.name);
  });
}));



},{"whammy":3}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
(function (process,global){
/*
	var vid = new Whammy.Video();
	vid.add(canvas or data url)
	vid.compile()
*/

global.Whammy = (function(){
	// in this case, frames has a very specific meaning, which will be 
	// detailed once i finish writing the code

	function toWebM(frames, outputAsArray){
		var info = checkFrames(frames);

		//max duration by cluster in milliseconds
		var CLUSTER_MAX_DURATION = 30000;
		
		var EBML = [
			{
				"id": 0x1a45dfa3, // EBML
				"data": [
					{ 
						"data": 1,
						"id": 0x4286 // EBMLVersion
					},
					{ 
						"data": 1,
						"id": 0x42f7 // EBMLReadVersion
					},
					{ 
						"data": 4,
						"id": 0x42f2 // EBMLMaxIDLength
					},
					{ 
						"data": 8,
						"id": 0x42f3 // EBMLMaxSizeLength
					},
					{ 
						"data": "webm",
						"id": 0x4282 // DocType
					},
					{ 
						"data": 2,
						"id": 0x4287 // DocTypeVersion
					},
					{ 
						"data": 2,
						"id": 0x4285 // DocTypeReadVersion
					}
				]
			},
			{
				"id": 0x18538067, // Segment
				"data": [
					{ 
						"id": 0x1549a966, // Info
						"data": [
							{  
								"data": 1e6, //do things in millisecs (num of nanosecs for duration scale)
								"id": 0x2ad7b1 // TimecodeScale
							},
							{ 
								"data": "whammy",
								"id": 0x4d80 // MuxingApp
							},
							{ 
								"data": "whammy",
								"id": 0x5741 // WritingApp
							},
							{ 
								"data": doubleToString(info.duration),
								"id": 0x4489 // Duration
							}
						]
					},
					{
						"id": 0x1654ae6b, // Tracks
						"data": [
							{
								"id": 0xae, // TrackEntry
								"data": [
									{  
										"data": 1,
										"id": 0xd7 // TrackNumber
									},
									{ 
										"data": 1,
										"id": 0x63c5 // TrackUID
									},
									{ 
										"data": 0,
										"id": 0x9c // FlagLacing
									},
									{ 
										"data": "und",
										"id": 0x22b59c // Language
									},
									{ 
										"data": "V_VP8",
										"id": 0x86 // CodecID
									},
									{ 
										"data": "VP8",
										"id": 0x258688 // CodecName
									},
									{ 
										"data": 1,
										"id": 0x83 // TrackType
									},
									{
										"id": 0xe0,  // Video
										"data": [
											{
												"data": info.width,
												"id": 0xb0 // PixelWidth
											},
											{ 
												"data": info.height,
												"id": 0xba // PixelHeight
											}
										]
									}
								]
							}
						]
					},

					//cluster insertion point
				]
			}
		 ];

						
		//Generate clusters (max duration)
		var frameNumber = 0;
		var clusterTimecode = 0;
		while(frameNumber < frames.length){
			
			var clusterFrames = [];
			var clusterDuration = 0;
			do {
				clusterFrames.push(frames[frameNumber]);
				clusterDuration += frames[frameNumber].duration;
				frameNumber++;				
			}while(frameNumber < frames.length && clusterDuration < CLUSTER_MAX_DURATION);
						
			var clusterCounter = 0;			
			var cluster = {
					"id": 0x1f43b675, // Cluster
					"data": [
						{  
							"data": clusterTimecode,
							"id": 0xe7 // Timecode
						}
					].concat(clusterFrames.map(function(webp){
						var block = makeSimpleBlock({
							discardable: 0,
							frame: webp.data.slice(4),
							invisible: 0,
							keyframe: 1,
							lacing: 0,
							trackNum: 1,
							timecode: Math.round(clusterCounter)
						});
						clusterCounter += webp.duration;
						return {
							data: block,
							id: 0xa3
						};
					}))
				}
			
			//Add cluster to segment
			EBML[1].data.push(cluster);			
			clusterTimecode += clusterDuration;
		}
						
		return generateEBML(EBML, outputAsArray)
	}

	// sums the lengths of all the frames and gets the duration, woo

	function checkFrames(frames){
		var width = frames[0].width, 
			height = frames[0].height, 
			duration = frames[0].duration;
		for(var i = 1; i < frames.length; i++){
			if(frames[i].width != width) throw "Frame " + (i + 1) + " has a different width";
			if(frames[i].height != height) throw "Frame " + (i + 1) + " has a different height";
			if(frames[i].duration < 0 || frames[i].duration > 0x7fff) throw "Frame " + (i + 1) + " has a weird duration (must be between 0 and 32767)";
			duration += frames[i].duration;
		}
		return {
			duration: duration,
			width: width,
			height: height
		};
	}


	function numToBuffer(num){
		var parts = [];
		while(num > 0){
			parts.push(num & 0xff)
			num = num >> 8
		}
		return new Uint8Array(parts.reverse());
	}

	function strToBuffer(str){
		// return new Blob([str]);

		var arr = new Uint8Array(str.length);
		for(var i = 0; i < str.length; i++){
			arr[i] = str.charCodeAt(i)
		}
		return arr;
		// this is slower
		// return new Uint8Array(str.split('').map(function(e){
		// 	return e.charCodeAt(0)
		// }))
	}


	//sorry this is ugly, and sort of hard to understand exactly why this was done
	// at all really, but the reason is that there's some code below that i dont really
	// feel like understanding, and this is easier than using my brain.

	function bitsToBuffer(bits){
		var data = [];
		var pad = (bits.length % 8) ? (new Array(1 + 8 - (bits.length % 8))).join('0') : '';
		bits = pad + bits;
		for(var i = 0; i < bits.length; i+= 8){
			data.push(parseInt(bits.substr(i,8),2))
		}
		return new Uint8Array(data);
	}

	function generateEBML(json, outputAsArray){
		var ebml = [];
		for(var i = 0; i < json.length; i++){
			var data = json[i].data;
			if(typeof data == 'object') data = generateEBML(data, outputAsArray);					
			if(typeof data == 'number') data = bitsToBuffer(data.toString(2));
			if(typeof data == 'string') data = strToBuffer(data);

			if(data.length){
				var z = z;
			}
			
			var len = data.size || data.byteLength || data.length;
			var zeroes = Math.ceil(Math.ceil(Math.log(len)/Math.log(2))/8);
			var size_str = len.toString(2);
			var padded = (new Array((zeroes * 7 + 7 + 1) - size_str.length)).join('0') + size_str;
			var size = (new Array(zeroes)).join('0') + '1' + padded;
			
			//i actually dont quite understand what went on up there, so I'm not really
			//going to fix this, i'm probably just going to write some hacky thing which
			//converts that string into a buffer-esque thing

			ebml.push(numToBuffer(json[i].id));
			ebml.push(bitsToBuffer(size));
			ebml.push(data)
			

		}
		
		//output as blob or byteArray
		if(outputAsArray){
			//convert ebml to an array
			var buffer = toFlatArray(ebml)
			return new Uint8Array(buffer);
		}else{
			return new Blob(ebml, {type: "video/webm"});
		}
	}
	
	function toFlatArray(arr, outBuffer){
		if(outBuffer == null){
			outBuffer = [];
		}
		for(var i = 0; i < arr.length; i++){
			if(typeof arr[i] == 'object'){
				//an array
				toFlatArray(arr[i], outBuffer)
			}else{
				//a simple element
				outBuffer.push(arr[i]);
			}
		}
		return outBuffer;
	}
	
	//OKAY, so the following two functions are the string-based old stuff, the reason they're
	//still sort of in here, is that they're actually faster than the new blob stuff because
	//getAsFile isn't widely implemented, or at least, it doesn't work in chrome, which is the
	// only browser which supports get as webp

	//Converting between a string of 0010101001's and binary back and forth is probably inefficient
	//TODO: get rid of this function
	function toBinStr_old(bits){
		var data = '';
		var pad = (bits.length % 8) ? (new Array(1 + 8 - (bits.length % 8))).join('0') : '';
		bits = pad + bits;
		for(var i = 0; i < bits.length; i+= 8){
			data += String.fromCharCode(parseInt(bits.substr(i,8),2))
		}
		return data;
	}

	function generateEBML_old(json){
		var ebml = '';
		for(var i = 0; i < json.length; i++){
			var data = json[i].data;
			if(typeof data == 'object') data = generateEBML_old(data);
			if(typeof data == 'number') data = toBinStr_old(data.toString(2));
			
			var len = data.length;
			var zeroes = Math.ceil(Math.ceil(Math.log(len)/Math.log(2))/8);
			var size_str = len.toString(2);
			var padded = (new Array((zeroes * 7 + 7 + 1) - size_str.length)).join('0') + size_str;
			var size = (new Array(zeroes)).join('0') + '1' + padded;

			ebml += toBinStr_old(json[i].id.toString(2)) + toBinStr_old(size) + data;

		}
		return ebml;
	}

	//woot, a function that's actually written for this project!
	//this parses some json markup and makes it into that binary magic
	//which can then get shoved into the matroska comtainer (peaceably)

	function makeSimpleBlock(data){
		var flags = 0;
		if (data.keyframe) flags |= 128;
		if (data.invisible) flags |= 8;
		if (data.lacing) flags |= (data.lacing << 1);
		if (data.discardable) flags |= 1;
		if (data.trackNum > 127) {
			throw "TrackNumber > 127 not supported";
		}
		var out = [data.trackNum | 0x80, data.timecode >> 8, data.timecode & 0xff, flags].map(function(e){
			return String.fromCharCode(e)
		}).join('') + data.frame;

		return out;
	}

	// here's something else taken verbatim from weppy, awesome rite?

	function parseWebP(riff){
		var VP8 = riff.RIFF[0].WEBP[0];
		
		var frame_start = VP8.indexOf('\x9d\x01\x2a'); //A VP8 keyframe starts with the 0x9d012a header
		for(var i = 0, c = []; i < 4; i++) c[i] = VP8.charCodeAt(frame_start + 3 + i);
		
		var width, horizontal_scale, height, vertical_scale, tmp;
		
		//the code below is literally copied verbatim from the bitstream spec
		tmp = (c[1] << 8) | c[0];
		width = tmp & 0x3FFF;
		horizontal_scale = tmp >> 14;
		tmp = (c[3] << 8) | c[2];
		height = tmp & 0x3FFF;
		vertical_scale = tmp >> 14;
		return {
			width: width,
			height: height,
			data: VP8,
			riff: riff
		}
	}

	// i think i'm going off on a riff by pretending this is some known
	// idiom which i'm making a casual and brilliant pun about, but since
	// i can't find anything on google which conforms to this idiomatic
	// usage, I'm assuming this is just a consequence of some psychotic
	// break which makes me make up puns. well, enough riff-raff (aha a
	// rescue of sorts), this function was ripped wholesale from weppy

	function parseRIFF(string){
		var offset = 0;
		var chunks = {};
		
		while (offset < string.length) {
			var id = string.substr(offset, 4);
			var len = parseInt(string.substr(offset + 4, 4).split('').map(function(i){
				var unpadded = i.charCodeAt(0).toString(2);
				return (new Array(8 - unpadded.length + 1)).join('0') + unpadded
			}).join(''),2);
			var data = string.substr(offset + 4 + 4, len);
			offset += 4 + 4 + len;
			chunks[id] = chunks[id] || [];
			
			if (id == 'RIFF' || id == 'LIST') {
				chunks[id].push(parseRIFF(data));
			} else {
				chunks[id].push(data);
			}
		}
		return chunks;
	}

	// here's a little utility function that acts as a utility for other functions
	// basically, the only purpose is for encoding "Duration", which is encoded as
	// a double (considerably more difficult to encode than an integer)
	function doubleToString(num){
		return [].slice.call(
			new Uint8Array(
				(
					new Float64Array([num]) //create a float64 array
				).buffer) //extract the array buffer
			, 0) // convert the Uint8Array into a regular array
			.map(function(e){ //since it's a regular array, we can now use map
				return String.fromCharCode(e) // encode all the bytes individually
			})
			.reverse() //correct the byte endianness (assume it's little endian for now)
			.join('') // join the bytes in holy matrimony as a string
	}

	function WhammyVideo(speed, quality){ // a more abstract-ish API
		this.frames = [];
		this.duration = 1000 / speed;
		this.quality = quality || 0.8;
	}

	WhammyVideo.prototype.add = function(frame, duration){
		if(typeof duration != 'undefined' && this.duration) throw "you can't pass a duration if the fps is set";
		if(typeof duration == 'undefined' && !this.duration) throw "if you don't have the fps set, you ned to have durations here."
		if('canvas' in frame){ //CanvasRenderingContext2D
			frame = frame.canvas;	
		}
		if('toDataURL' in frame){
			frame = frame.toDataURL('image/webp', this.quality)
		}else if(typeof frame != "string"){
			throw "frame must be a a HTMLCanvasElement, a CanvasRenderingContext2D or a DataURI formatted string"
		}
		if (!(/^data:image\/webp;base64,/ig).test(frame)) {
			throw "Input must be formatted properly as a base64 encoded DataURI of type image/webp";
		}
		this.frames.push({
			image: frame,
			duration: duration || this.duration
		})
	}
	
	WhammyVideo.prototype.compile = function(outputAsArray){
		return new toWebM(this.frames.map(function(frame){
			var webp = parseWebP(parseRIFF(atob(frame.image.slice(23))));
			webp.duration = frame.duration;
			return webp;
		}), outputAsArray)
	}

	return {
		Video: WhammyVideo,
		fromImageArray: function(images, fps, outputAsArray){
			return toWebM(images.map(function(image){
				var webp = parseWebP(parseRIFF(atob(image.slice(23))))
				webp.duration = 1000 / fps;
				return webp;
			}), outputAsArray)
		},
		toWebM: toWebM
		// expose methods of madness
	}
})();

if (typeof process !== 'undefined') module.exports = Whammy;

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":2}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMveGVyby9Eb2N1bWVudHMvVGFsa3MvMjAxNV8xMS9jb2RlLzlfaWNoYXQvY2xpZW50L3JlY29yZC5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvd2hhbW15L3doYW1teS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQUEsTUFBTSxBQUFDLENBQUMsUUFBTyxDQUFDLENBQUE7QUFFaEIsT0FBTyxpQkFBaUIsQUFBQyxDQUFDLGtCQUFpQixHQUFHLFNBQUEsQUFBQztBQUM3QyxVQUFRLGFBQWEsRUFBSSxDQUFBLFNBQVEsYUFBYSxHQUFLLENBQUEsU0FBUSxtQkFBbUIsQ0FBQTtBQUU5RSxPQUFLLElBQUksRUFBSSxDQUFBLE1BQUssSUFBSSxHQUFLLENBQUEsTUFBSyxVQUFVLENBQUE7QUFDMUMsT0FBSyxzQkFBc0IsRUFBSSxDQUFBLE1BQUssc0JBQXNCLEdBQUssQ0FBQSxNQUFLLDRCQUE0QixDQUFBO0FBQ2hHLE9BQUsscUJBQXFCLEVBQUksQ0FBQSxNQUFLLHFCQUFxQixHQUFLLENBQUEsTUFBSywyQkFBMkIsQ0FBQTtBQUU3RixVQUFRLGFBQWEsQUFBQyxDQUFDO0FBQ3JCLFFBQUksQ0FBRyxNQUFJO0FBQ1gsUUFBSSxDQUFHLEVBQ0wsU0FBUSxDQUFHO0FBQ1QsZUFBTyxDQUFHLEtBQUc7QUFDYixlQUFPLENBQUcsS0FBRztBQUViLGdCQUFRLENBQUcsSUFBRTtBQUNiLGdCQUFRLENBQUcsS0FBRztBQUFBLE1BQ2hCLENBQ0Y7QUFBQSxFQUNGLEdBQUcsU0FBQyxNQUFLO0FBQ1AsQUFBSSxNQUFBLENBQUEsTUFBSyxFQUFJLENBQUEsUUFBTyxjQUFjLEFBQUMsQ0FBQyxRQUFPLENBQUMsQ0FBQTtBQUM1QyxBQUFJLE1BQUEsQ0FBQSxPQUFNLEVBQUksQ0FBQSxNQUFLLFdBQVcsQUFBQyxDQUFDLElBQUcsQ0FBQyxDQUFBO0FBQ3BDLEFBQUksTUFBQSxDQUFBLEtBQUksRUFBSSxDQUFBLFFBQU8sY0FBYyxBQUFDLENBQUMsT0FBTSxDQUFDLENBQUE7QUFFMUMsUUFBSSxJQUFJLEVBQUksQ0FBQSxHQUFFLGdCQUFnQixBQUFDLENBQUMsTUFBSyxDQUFDLENBQUE7QUFDdEMsUUFBSSxNQUFNLEVBQUksS0FBRyxDQUFBO0FBQ2pCLFFBQUksS0FBSyxBQUFDLEVBQUMsQ0FBQTtBQUVYLEFBQUksTUFBQSxDQUFBLE1BQUssRUFBSSxHQUFDLENBQUE7QUFDZCxBQUFJLE1BQUEsQ0FBQSxXQUFVLEVBQUksSUFBSSxDQUFBLE1BQUssTUFBTSxBQUFDLEVBQUMsQ0FBQTtBQUNuQyxBQUFJLE1BQUEsQ0FBQSxXQUFVLENBQUE7QUFFZCxRQUFJLGlCQUFpQixBQUFDLENBQUMsU0FBUSxHQUFHLFNBQUEsQUFBQztBQUNqQyxlQUFTLEFBQUMsRUFBQyxTQUFBLEFBQUM7QUFDViwyQkFBbUIsQUFBQyxDQUFDLFdBQVUsQ0FBQyxDQUFBO0FBQ2hDLGFBQUssVUFBVSxBQUFDLEVBQUMsQ0FBRSxDQUFBLENBQUMsS0FBSyxBQUFDLEVBQUMsQ0FBQTtBQUUzQixrQkFBVSxPQUFPLEVBQUksQ0FBQSxNQUFLLE1BQU0sQUFBQyxDQUFDLENBQUEsQ0FBQyxDQUFBO0FBRW5DLEFBQUksVUFBQSxDQUFBLElBQUcsRUFBSSxDQUFBLFdBQVUsUUFBUSxBQUFDLEVBQUMsQ0FBQTtBQUMvQixBQUFJLFVBQUEsQ0FBQSxHQUFFLEVBQUksSUFBSSxlQUFhLEFBQUMsRUFBQyxDQUFBO0FBRTdCLFVBQUUsT0FBTyxJQUFJLFNBQUEsQUFBQyxDQUFLO0FBQ2pCLGNBQUksQUFBQyxDQUFDLEtBQUksQ0FBQyxDQUFBO1FBQ2IsQ0FBQSxDQUFBO0FBRUEsVUFBRSxLQUFLLEFBQUMsQ0FBQyxNQUFLLENBQUcsZ0JBQWMsQ0FBRyxLQUFHLENBQUMsQ0FBQTtBQUN0QyxVQUFFLEtBQUssQUFBQyxDQUFDLElBQUcsQ0FBQyxDQUFBO01BQ2YsRUFBRyxLQUFHLENBQUMsQ0FBQTtBQUVQLEFBQUksUUFBQSxDQUFBLFFBQU8sRUFBSSxDQUFBLEdBQUksS0FBRyxBQUFDLEVBQUMsUUFBUSxBQUFDLEVBQUMsQ0FBQTtBQUVsQyxXQUFLLE1BQU0sRUFBSSxDQUFBLEtBQUksV0FBVyxDQUFBO0FBQzlCLFdBQUssT0FBTyxFQUFJLENBQUEsS0FBSSxZQUFZLENBQUE7QUFFaEMsYUFBUyxLQUFHLENBQUMsQUFBQyxDQUFFO0FBQ2QsQUFBSSxVQUFBLENBQUEsUUFBTyxFQUFJLENBQUEsR0FBSSxLQUFHLEFBQUMsRUFBQyxRQUFRLEFBQUMsRUFBQyxDQUFBLENBQUksU0FBTyxDQUFBO0FBRTdDLGVBQU8sRUFBSSxDQUFBLEdBQUksS0FBRyxBQUFDLEVBQUMsUUFBUSxBQUFDLEVBQUMsQ0FBQTtBQUU5QixjQUFNLFVBQVUsQUFBQyxDQUFDLEtBQUksQ0FBRyxFQUFBLENBQUcsRUFBQSxDQUFHLENBQUEsTUFBSyxNQUFNLENBQUcsQ0FBQSxNQUFLLE9BQU8sQ0FBQyxDQUFBO0FBQzFELGFBQUssS0FBSyxBQUFDLENBQUM7QUFDVixpQkFBTyxDQUFHLFNBQU87QUFDakIsY0FBSSxDQUFHLENBQUEsTUFBSyxVQUFVLEFBQUMsQ0FBQyxZQUFXLENBQUcsSUFBRSxDQUFDO0FBQUEsUUFDM0MsQ0FBQyxDQUFBO0FBRUQsa0JBQVUsRUFBSSxDQUFBLHFCQUFvQixBQUFDLENBQUMsSUFBRyxDQUFDLENBQUE7TUFDMUM7QUFBQSxBQUVBLGdCQUFVLEVBQUksQ0FBQSxxQkFBb0IsQUFBQyxDQUFDLElBQUcsQ0FBQyxDQUFBO0lBQzFDLEVBQUMsQ0FBQTtFQUNILEVBQUcsVUFBUyxHQUFFLENBQUc7QUFDZixVQUFNLElBQUksQUFBQyxDQUFDLCtCQUE4QixFQUFJLENBQUEsR0FBRSxLQUFLLENBQUMsQ0FBQztFQUN6RCxDQUFDLENBQUE7QUFDSCxFQUFDLENBQUE7QUFBQTs7OztBQzNFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJyZXF1aXJlKCd3aGFtbXknKVxuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xuICBuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhID0gbmF2aWdhdG9yLmdldFVzZXJNZWRpYSB8fCBuYXZpZ2F0b3Iud2Via2l0R2V0VXNlck1lZGlhXG5cbiAgd2luZG93LlVSTCA9IHdpbmRvdy5VUkwgfHwgd2luZG93LndlYmtpdFVSTFxuICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cud2Via2l0Q2FuY2VsQW5pbWF0aW9uRnJhbWVcbiAgXG4gIG5hdmlnYXRvci5nZXRVc2VyTWVkaWEoe1xuICAgIGF1ZGlvOiBmYWxzZSxcbiAgICB2aWRlbzoge1xuICAgICAgbWFuZGF0b3J5OiB7XG4gICAgICAgIG1pbldpZHRoOiAxMDI0LFxuICAgICAgICBtYXhXaWR0aDogMTkyMCxcblxuICAgICAgICBtaW5IZWlnaHQ6IDU3NixcbiAgICAgICAgbWF4SGVpZ2h0OiAxMDgwXG4gICAgICB9XG4gICAgfVxuICB9LCAoc3RyZWFtKSA9PiB7XG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpXG4gICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKVxuICAgIHZhciB2aWRlbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ZpZGVvJylcblxuICAgIHZpZGVvLnNyYyA9IFVSTC5jcmVhdGVPYmplY3RVUkwoc3RyZWFtKVxuICAgIHZpZGVvLm11dGVkID0gdHJ1ZVxuICAgIHZpZGVvLnBsYXkoKVxuXG4gICAgdmFyIGZyYW1lcyA9IFtdXG4gICAgdmFyIHdoYW1teVZpZGVvID0gbmV3IFdoYW1teS5WaWRlbygpXG4gICAgdmFyIGRyYXdUaW1lb3V0XG5cbiAgICB2aWRlby5hZGRFdmVudExpc3RlbmVyKCdjYW5wbGF5JywgKCkgPT4ge1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKGRyYXdUaW1lb3V0KVxuICAgICAgICBzdHJlYW0uZ2V0VHJhY2tzKClbMF0uc3RvcCgpXG5cbiAgICAgICAgd2hhbW15VmlkZW8uZnJhbWVzID0gZnJhbWVzLnNsaWNlKDApXG5cbiAgICAgICAgdmFyIGJsb2IgPSB3aGFtbXlWaWRlby5jb21waWxlKClcbiAgICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpXG5cbiAgICAgICAgeGhyLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgICBhbGVydCgnT0shJylcbiAgICAgICAgfVxuXG4gICAgICAgIHhoci5vcGVuKCdQT1NUJywgJ3NhdmVSZWNvcmRpbmcnLCB0cnVlKVxuICAgICAgICB4aHIuc2VuZChibG9iKVxuICAgICAgfSwgNTAwMClcblxuICAgICAgdmFyIGxhc3RUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKClcblxuICAgICAgY2FudmFzLndpZHRoID0gdmlkZW8udmlkZW9XaWR0aFxuICAgICAgY2FudmFzLmhlaWdodCA9IHZpZGVvLnZpZGVvSGVpZ2h0XG5cbiAgICAgIGZ1bmN0aW9uIGRyYXcoKSB7XG4gICAgICAgIHZhciBkdXJhdGlvbiA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gbGFzdFRpbWVcblxuICAgICAgICBsYXN0VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpXG5cbiAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UodmlkZW8sIDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodClcbiAgICAgICAgZnJhbWVzLnB1c2goe1xuICAgICAgICAgIGR1cmF0aW9uOiBkdXJhdGlvbixcbiAgICAgICAgICBpbWFnZTogY2FudmFzLnRvRGF0YVVSTCgnaW1hZ2Uvd2VicCcsIDAuOClcbiAgICAgICAgfSlcblxuICAgICAgICBkcmF3VGltZW91dCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZShkcmF3KVxuICAgICAgfVxuXG4gICAgICBkcmF3VGltZW91dCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZShkcmF3KVxuICAgIH0pXG4gIH0sIGZ1bmN0aW9uKGVycikge1xuICAgIGNvbnNvbGUubG9nKFwiVGhlIGZvbGxvd2luZyBlcnJvciBvY2N1cmVkOiBcIiArIGVyci5uYW1lKTtcbiAgfSlcbn0pIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIvKlxuXHR2YXIgdmlkID0gbmV3IFdoYW1teS5WaWRlbygpO1xuXHR2aWQuYWRkKGNhbnZhcyBvciBkYXRhIHVybClcblx0dmlkLmNvbXBpbGUoKVxuKi9cblxuZ2xvYmFsLldoYW1teSA9IChmdW5jdGlvbigpe1xuXHQvLyBpbiB0aGlzIGNhc2UsIGZyYW1lcyBoYXMgYSB2ZXJ5IHNwZWNpZmljIG1lYW5pbmcsIHdoaWNoIHdpbGwgYmUgXG5cdC8vIGRldGFpbGVkIG9uY2UgaSBmaW5pc2ggd3JpdGluZyB0aGUgY29kZVxuXG5cdGZ1bmN0aW9uIHRvV2ViTShmcmFtZXMsIG91dHB1dEFzQXJyYXkpe1xuXHRcdHZhciBpbmZvID0gY2hlY2tGcmFtZXMoZnJhbWVzKTtcblxuXHRcdC8vbWF4IGR1cmF0aW9uIGJ5IGNsdXN0ZXIgaW4gbWlsbGlzZWNvbmRzXG5cdFx0dmFyIENMVVNURVJfTUFYX0RVUkFUSU9OID0gMzAwMDA7XG5cdFx0XG5cdFx0dmFyIEVCTUwgPSBbXG5cdFx0XHR7XG5cdFx0XHRcdFwiaWRcIjogMHgxYTQ1ZGZhMywgLy8gRUJNTFxuXHRcdFx0XHRcImRhdGFcIjogW1xuXHRcdFx0XHRcdHsgXG5cdFx0XHRcdFx0XHRcImRhdGFcIjogMSxcblx0XHRcdFx0XHRcdFwiaWRcIjogMHg0Mjg2IC8vIEVCTUxWZXJzaW9uXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR7IFxuXHRcdFx0XHRcdFx0XCJkYXRhXCI6IDEsXG5cdFx0XHRcdFx0XHRcImlkXCI6IDB4NDJmNyAvLyBFQk1MUmVhZFZlcnNpb25cblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHsgXG5cdFx0XHRcdFx0XHRcImRhdGFcIjogNCxcblx0XHRcdFx0XHRcdFwiaWRcIjogMHg0MmYyIC8vIEVCTUxNYXhJRExlbmd0aFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0eyBcblx0XHRcdFx0XHRcdFwiZGF0YVwiOiA4LFxuXHRcdFx0XHRcdFx0XCJpZFwiOiAweDQyZjMgLy8gRUJNTE1heFNpemVMZW5ndGhcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHsgXG5cdFx0XHRcdFx0XHRcImRhdGFcIjogXCJ3ZWJtXCIsXG5cdFx0XHRcdFx0XHRcImlkXCI6IDB4NDI4MiAvLyBEb2NUeXBlXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR7IFxuXHRcdFx0XHRcdFx0XCJkYXRhXCI6IDIsXG5cdFx0XHRcdFx0XHRcImlkXCI6IDB4NDI4NyAvLyBEb2NUeXBlVmVyc2lvblxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0eyBcblx0XHRcdFx0XHRcdFwiZGF0YVwiOiAyLFxuXHRcdFx0XHRcdFx0XCJpZFwiOiAweDQyODUgLy8gRG9jVHlwZVJlYWRWZXJzaW9uXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRdXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRcImlkXCI6IDB4MTg1MzgwNjcsIC8vIFNlZ21lbnRcblx0XHRcdFx0XCJkYXRhXCI6IFtcblx0XHRcdFx0XHR7IFxuXHRcdFx0XHRcdFx0XCJpZFwiOiAweDE1NDlhOTY2LCAvLyBJbmZvXG5cdFx0XHRcdFx0XHRcImRhdGFcIjogW1xuXHRcdFx0XHRcdFx0XHR7ICBcblx0XHRcdFx0XHRcdFx0XHRcImRhdGFcIjogMWU2LCAvL2RvIHRoaW5ncyBpbiBtaWxsaXNlY3MgKG51bSBvZiBuYW5vc2VjcyBmb3IgZHVyYXRpb24gc2NhbGUpXG5cdFx0XHRcdFx0XHRcdFx0XCJpZFwiOiAweDJhZDdiMSAvLyBUaW1lY29kZVNjYWxlXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdHsgXG5cdFx0XHRcdFx0XHRcdFx0XCJkYXRhXCI6IFwid2hhbW15XCIsXG5cdFx0XHRcdFx0XHRcdFx0XCJpZFwiOiAweDRkODAgLy8gTXV4aW5nQXBwXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdHsgXG5cdFx0XHRcdFx0XHRcdFx0XCJkYXRhXCI6IFwid2hhbW15XCIsXG5cdFx0XHRcdFx0XHRcdFx0XCJpZFwiOiAweDU3NDEgLy8gV3JpdGluZ0FwcFxuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHR7IFxuXHRcdFx0XHRcdFx0XHRcdFwiZGF0YVwiOiBkb3VibGVUb1N0cmluZyhpbmZvLmR1cmF0aW9uKSxcblx0XHRcdFx0XHRcdFx0XHRcImlkXCI6IDB4NDQ4OSAvLyBEdXJhdGlvblxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRdXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcImlkXCI6IDB4MTY1NGFlNmIsIC8vIFRyYWNrc1xuXHRcdFx0XHRcdFx0XCJkYXRhXCI6IFtcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFwiaWRcIjogMHhhZSwgLy8gVHJhY2tFbnRyeVxuXHRcdFx0XHRcdFx0XHRcdFwiZGF0YVwiOiBbXG5cdFx0XHRcdFx0XHRcdFx0XHR7ICBcblx0XHRcdFx0XHRcdFx0XHRcdFx0XCJkYXRhXCI6IDEsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFwiaWRcIjogMHhkNyAvLyBUcmFja051bWJlclxuXHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdHsgXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFwiZGF0YVwiOiAxLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcImlkXCI6IDB4NjNjNSAvLyBUcmFja1VJRFxuXHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdHsgXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFwiZGF0YVwiOiAwLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcImlkXCI6IDB4OWMgLy8gRmxhZ0xhY2luZ1xuXHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdHsgXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFwiZGF0YVwiOiBcInVuZFwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcImlkXCI6IDB4MjJiNTljIC8vIExhbmd1YWdlXG5cdFx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFx0eyBcblx0XHRcdFx0XHRcdFx0XHRcdFx0XCJkYXRhXCI6IFwiVl9WUDhcIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XCJpZFwiOiAweDg2IC8vIENvZGVjSURcblx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHR7IFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcImRhdGFcIjogXCJWUDhcIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XCJpZFwiOiAweDI1ODY4OCAvLyBDb2RlY05hbWVcblx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHR7IFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcImRhdGFcIjogMSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XCJpZFwiOiAweDgzIC8vIFRyYWNrVHlwZVxuXHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XCJpZFwiOiAweGUwLCAgLy8gVmlkZW9cblx0XHRcdFx0XHRcdFx0XHRcdFx0XCJkYXRhXCI6IFtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcImRhdGFcIjogaW5mby53aWR0aCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFwiaWRcIjogMHhiMCAvLyBQaXhlbFdpZHRoXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR7IFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XCJkYXRhXCI6IGluZm8uaGVpZ2h0LFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XCJpZFwiOiAweGJhIC8vIFBpeGVsSGVpZ2h0XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRdXG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRdXG5cdFx0XHRcdFx0fSxcblxuXHRcdFx0XHRcdC8vY2x1c3RlciBpbnNlcnRpb24gcG9pbnRcblx0XHRcdFx0XVxuXHRcdFx0fVxuXHRcdCBdO1xuXG5cdFx0XHRcdFx0XHRcblx0XHQvL0dlbmVyYXRlIGNsdXN0ZXJzIChtYXggZHVyYXRpb24pXG5cdFx0dmFyIGZyYW1lTnVtYmVyID0gMDtcblx0XHR2YXIgY2x1c3RlclRpbWVjb2RlID0gMDtcblx0XHR3aGlsZShmcmFtZU51bWJlciA8IGZyYW1lcy5sZW5ndGgpe1xuXHRcdFx0XG5cdFx0XHR2YXIgY2x1c3RlckZyYW1lcyA9IFtdO1xuXHRcdFx0dmFyIGNsdXN0ZXJEdXJhdGlvbiA9IDA7XG5cdFx0XHRkbyB7XG5cdFx0XHRcdGNsdXN0ZXJGcmFtZXMucHVzaChmcmFtZXNbZnJhbWVOdW1iZXJdKTtcblx0XHRcdFx0Y2x1c3RlckR1cmF0aW9uICs9IGZyYW1lc1tmcmFtZU51bWJlcl0uZHVyYXRpb247XG5cdFx0XHRcdGZyYW1lTnVtYmVyKys7XHRcdFx0XHRcblx0XHRcdH13aGlsZShmcmFtZU51bWJlciA8IGZyYW1lcy5sZW5ndGggJiYgY2x1c3RlckR1cmF0aW9uIDwgQ0xVU1RFUl9NQVhfRFVSQVRJT04pO1xuXHRcdFx0XHRcdFx0XG5cdFx0XHR2YXIgY2x1c3RlckNvdW50ZXIgPSAwO1x0XHRcdFxuXHRcdFx0dmFyIGNsdXN0ZXIgPSB7XG5cdFx0XHRcdFx0XCJpZFwiOiAweDFmNDNiNjc1LCAvLyBDbHVzdGVyXG5cdFx0XHRcdFx0XCJkYXRhXCI6IFtcblx0XHRcdFx0XHRcdHsgIFxuXHRcdFx0XHRcdFx0XHRcImRhdGFcIjogY2x1c3RlclRpbWVjb2RlLFxuXHRcdFx0XHRcdFx0XHRcImlkXCI6IDB4ZTcgLy8gVGltZWNvZGVcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRdLmNvbmNhdChjbHVzdGVyRnJhbWVzLm1hcChmdW5jdGlvbih3ZWJwKXtcblx0XHRcdFx0XHRcdHZhciBibG9jayA9IG1ha2VTaW1wbGVCbG9jayh7XG5cdFx0XHRcdFx0XHRcdGRpc2NhcmRhYmxlOiAwLFxuXHRcdFx0XHRcdFx0XHRmcmFtZTogd2VicC5kYXRhLnNsaWNlKDQpLFxuXHRcdFx0XHRcdFx0XHRpbnZpc2libGU6IDAsXG5cdFx0XHRcdFx0XHRcdGtleWZyYW1lOiAxLFxuXHRcdFx0XHRcdFx0XHRsYWNpbmc6IDAsXG5cdFx0XHRcdFx0XHRcdHRyYWNrTnVtOiAxLFxuXHRcdFx0XHRcdFx0XHR0aW1lY29kZTogTWF0aC5yb3VuZChjbHVzdGVyQ291bnRlcilcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0Y2x1c3RlckNvdW50ZXIgKz0gd2VicC5kdXJhdGlvbjtcblx0XHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRcdGRhdGE6IGJsb2NrLFxuXHRcdFx0XHRcdFx0XHRpZDogMHhhM1xuXHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHR9KSlcblx0XHRcdFx0fVxuXHRcdFx0XG5cdFx0XHQvL0FkZCBjbHVzdGVyIHRvIHNlZ21lbnRcblx0XHRcdEVCTUxbMV0uZGF0YS5wdXNoKGNsdXN0ZXIpO1x0XHRcdFxuXHRcdFx0Y2x1c3RlclRpbWVjb2RlICs9IGNsdXN0ZXJEdXJhdGlvbjtcblx0XHR9XG5cdFx0XHRcdFx0XHRcblx0XHRyZXR1cm4gZ2VuZXJhdGVFQk1MKEVCTUwsIG91dHB1dEFzQXJyYXkpXG5cdH1cblxuXHQvLyBzdW1zIHRoZSBsZW5ndGhzIG9mIGFsbCB0aGUgZnJhbWVzIGFuZCBnZXRzIHRoZSBkdXJhdGlvbiwgd29vXG5cblx0ZnVuY3Rpb24gY2hlY2tGcmFtZXMoZnJhbWVzKXtcblx0XHR2YXIgd2lkdGggPSBmcmFtZXNbMF0ud2lkdGgsIFxuXHRcdFx0aGVpZ2h0ID0gZnJhbWVzWzBdLmhlaWdodCwgXG5cdFx0XHRkdXJhdGlvbiA9IGZyYW1lc1swXS5kdXJhdGlvbjtcblx0XHRmb3IodmFyIGkgPSAxOyBpIDwgZnJhbWVzLmxlbmd0aDsgaSsrKXtcblx0XHRcdGlmKGZyYW1lc1tpXS53aWR0aCAhPSB3aWR0aCkgdGhyb3cgXCJGcmFtZSBcIiArIChpICsgMSkgKyBcIiBoYXMgYSBkaWZmZXJlbnQgd2lkdGhcIjtcblx0XHRcdGlmKGZyYW1lc1tpXS5oZWlnaHQgIT0gaGVpZ2h0KSB0aHJvdyBcIkZyYW1lIFwiICsgKGkgKyAxKSArIFwiIGhhcyBhIGRpZmZlcmVudCBoZWlnaHRcIjtcblx0XHRcdGlmKGZyYW1lc1tpXS5kdXJhdGlvbiA8IDAgfHwgZnJhbWVzW2ldLmR1cmF0aW9uID4gMHg3ZmZmKSB0aHJvdyBcIkZyYW1lIFwiICsgKGkgKyAxKSArIFwiIGhhcyBhIHdlaXJkIGR1cmF0aW9uIChtdXN0IGJlIGJldHdlZW4gMCBhbmQgMzI3NjcpXCI7XG5cdFx0XHRkdXJhdGlvbiArPSBmcmFtZXNbaV0uZHVyYXRpb247XG5cdFx0fVxuXHRcdHJldHVybiB7XG5cdFx0XHRkdXJhdGlvbjogZHVyYXRpb24sXG5cdFx0XHR3aWR0aDogd2lkdGgsXG5cdFx0XHRoZWlnaHQ6IGhlaWdodFxuXHRcdH07XG5cdH1cblxuXG5cdGZ1bmN0aW9uIG51bVRvQnVmZmVyKG51bSl7XG5cdFx0dmFyIHBhcnRzID0gW107XG5cdFx0d2hpbGUobnVtID4gMCl7XG5cdFx0XHRwYXJ0cy5wdXNoKG51bSAmIDB4ZmYpXG5cdFx0XHRudW0gPSBudW0gPj4gOFxuXHRcdH1cblx0XHRyZXR1cm4gbmV3IFVpbnQ4QXJyYXkocGFydHMucmV2ZXJzZSgpKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHN0clRvQnVmZmVyKHN0cil7XG5cdFx0Ly8gcmV0dXJuIG5ldyBCbG9iKFtzdHJdKTtcblxuXHRcdHZhciBhcnIgPSBuZXcgVWludDhBcnJheShzdHIubGVuZ3RoKTtcblx0XHRmb3IodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKXtcblx0XHRcdGFycltpXSA9IHN0ci5jaGFyQ29kZUF0KGkpXG5cdFx0fVxuXHRcdHJldHVybiBhcnI7XG5cdFx0Ly8gdGhpcyBpcyBzbG93ZXJcblx0XHQvLyByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoc3RyLnNwbGl0KCcnKS5tYXAoZnVuY3Rpb24oZSl7XG5cdFx0Ly8gXHRyZXR1cm4gZS5jaGFyQ29kZUF0KDApXG5cdFx0Ly8gfSkpXG5cdH1cblxuXG5cdC8vc29ycnkgdGhpcyBpcyB1Z2x5LCBhbmQgc29ydCBvZiBoYXJkIHRvIHVuZGVyc3RhbmQgZXhhY3RseSB3aHkgdGhpcyB3YXMgZG9uZVxuXHQvLyBhdCBhbGwgcmVhbGx5LCBidXQgdGhlIHJlYXNvbiBpcyB0aGF0IHRoZXJlJ3Mgc29tZSBjb2RlIGJlbG93IHRoYXQgaSBkb250IHJlYWxseVxuXHQvLyBmZWVsIGxpa2UgdW5kZXJzdGFuZGluZywgYW5kIHRoaXMgaXMgZWFzaWVyIHRoYW4gdXNpbmcgbXkgYnJhaW4uXG5cblx0ZnVuY3Rpb24gYml0c1RvQnVmZmVyKGJpdHMpe1xuXHRcdHZhciBkYXRhID0gW107XG5cdFx0dmFyIHBhZCA9IChiaXRzLmxlbmd0aCAlIDgpID8gKG5ldyBBcnJheSgxICsgOCAtIChiaXRzLmxlbmd0aCAlIDgpKSkuam9pbignMCcpIDogJyc7XG5cdFx0Yml0cyA9IHBhZCArIGJpdHM7XG5cdFx0Zm9yKHZhciBpID0gMDsgaSA8IGJpdHMubGVuZ3RoOyBpKz0gOCl7XG5cdFx0XHRkYXRhLnB1c2gocGFyc2VJbnQoYml0cy5zdWJzdHIoaSw4KSwyKSlcblx0XHR9XG5cdFx0cmV0dXJuIG5ldyBVaW50OEFycmF5KGRhdGEpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2VuZXJhdGVFQk1MKGpzb24sIG91dHB1dEFzQXJyYXkpe1xuXHRcdHZhciBlYm1sID0gW107XG5cdFx0Zm9yKHZhciBpID0gMDsgaSA8IGpzb24ubGVuZ3RoOyBpKyspe1xuXHRcdFx0dmFyIGRhdGEgPSBqc29uW2ldLmRhdGE7XG5cdFx0XHRpZih0eXBlb2YgZGF0YSA9PSAnb2JqZWN0JykgZGF0YSA9IGdlbmVyYXRlRUJNTChkYXRhLCBvdXRwdXRBc0FycmF5KTtcdFx0XHRcdFx0XG5cdFx0XHRpZih0eXBlb2YgZGF0YSA9PSAnbnVtYmVyJykgZGF0YSA9IGJpdHNUb0J1ZmZlcihkYXRhLnRvU3RyaW5nKDIpKTtcblx0XHRcdGlmKHR5cGVvZiBkYXRhID09ICdzdHJpbmcnKSBkYXRhID0gc3RyVG9CdWZmZXIoZGF0YSk7XG5cblx0XHRcdGlmKGRhdGEubGVuZ3RoKXtcblx0XHRcdFx0dmFyIHogPSB6O1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHR2YXIgbGVuID0gZGF0YS5zaXplIHx8IGRhdGEuYnl0ZUxlbmd0aCB8fCBkYXRhLmxlbmd0aDtcblx0XHRcdHZhciB6ZXJvZXMgPSBNYXRoLmNlaWwoTWF0aC5jZWlsKE1hdGgubG9nKGxlbikvTWF0aC5sb2coMikpLzgpO1xuXHRcdFx0dmFyIHNpemVfc3RyID0gbGVuLnRvU3RyaW5nKDIpO1xuXHRcdFx0dmFyIHBhZGRlZCA9IChuZXcgQXJyYXkoKHplcm9lcyAqIDcgKyA3ICsgMSkgLSBzaXplX3N0ci5sZW5ndGgpKS5qb2luKCcwJykgKyBzaXplX3N0cjtcblx0XHRcdHZhciBzaXplID0gKG5ldyBBcnJheSh6ZXJvZXMpKS5qb2luKCcwJykgKyAnMScgKyBwYWRkZWQ7XG5cdFx0XHRcblx0XHRcdC8vaSBhY3R1YWxseSBkb250IHF1aXRlIHVuZGVyc3RhbmQgd2hhdCB3ZW50IG9uIHVwIHRoZXJlLCBzbyBJJ20gbm90IHJlYWxseVxuXHRcdFx0Ly9nb2luZyB0byBmaXggdGhpcywgaSdtIHByb2JhYmx5IGp1c3QgZ29pbmcgdG8gd3JpdGUgc29tZSBoYWNreSB0aGluZyB3aGljaFxuXHRcdFx0Ly9jb252ZXJ0cyB0aGF0IHN0cmluZyBpbnRvIGEgYnVmZmVyLWVzcXVlIHRoaW5nXG5cblx0XHRcdGVibWwucHVzaChudW1Ub0J1ZmZlcihqc29uW2ldLmlkKSk7XG5cdFx0XHRlYm1sLnB1c2goYml0c1RvQnVmZmVyKHNpemUpKTtcblx0XHRcdGVibWwucHVzaChkYXRhKVxuXHRcdFx0XG5cblx0XHR9XG5cdFx0XG5cdFx0Ly9vdXRwdXQgYXMgYmxvYiBvciBieXRlQXJyYXlcblx0XHRpZihvdXRwdXRBc0FycmF5KXtcblx0XHRcdC8vY29udmVydCBlYm1sIHRvIGFuIGFycmF5XG5cdFx0XHR2YXIgYnVmZmVyID0gdG9GbGF0QXJyYXkoZWJtbClcblx0XHRcdHJldHVybiBuZXcgVWludDhBcnJheShidWZmZXIpO1xuXHRcdH1lbHNle1xuXHRcdFx0cmV0dXJuIG5ldyBCbG9iKGVibWwsIHt0eXBlOiBcInZpZGVvL3dlYm1cIn0pO1xuXHRcdH1cblx0fVxuXHRcblx0ZnVuY3Rpb24gdG9GbGF0QXJyYXkoYXJyLCBvdXRCdWZmZXIpe1xuXHRcdGlmKG91dEJ1ZmZlciA9PSBudWxsKXtcblx0XHRcdG91dEJ1ZmZlciA9IFtdO1xuXHRcdH1cblx0XHRmb3IodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKXtcblx0XHRcdGlmKHR5cGVvZiBhcnJbaV0gPT0gJ29iamVjdCcpe1xuXHRcdFx0XHQvL2FuIGFycmF5XG5cdFx0XHRcdHRvRmxhdEFycmF5KGFycltpXSwgb3V0QnVmZmVyKVxuXHRcdFx0fWVsc2V7XG5cdFx0XHRcdC8vYSBzaW1wbGUgZWxlbWVudFxuXHRcdFx0XHRvdXRCdWZmZXIucHVzaChhcnJbaV0pO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gb3V0QnVmZmVyO1xuXHR9XG5cdFxuXHQvL09LQVksIHNvIHRoZSBmb2xsb3dpbmcgdHdvIGZ1bmN0aW9ucyBhcmUgdGhlIHN0cmluZy1iYXNlZCBvbGQgc3R1ZmYsIHRoZSByZWFzb24gdGhleSdyZVxuXHQvL3N0aWxsIHNvcnQgb2YgaW4gaGVyZSwgaXMgdGhhdCB0aGV5J3JlIGFjdHVhbGx5IGZhc3RlciB0aGFuIHRoZSBuZXcgYmxvYiBzdHVmZiBiZWNhdXNlXG5cdC8vZ2V0QXNGaWxlIGlzbid0IHdpZGVseSBpbXBsZW1lbnRlZCwgb3IgYXQgbGVhc3QsIGl0IGRvZXNuJ3Qgd29yayBpbiBjaHJvbWUsIHdoaWNoIGlzIHRoZVxuXHQvLyBvbmx5IGJyb3dzZXIgd2hpY2ggc3VwcG9ydHMgZ2V0IGFzIHdlYnBcblxuXHQvL0NvbnZlcnRpbmcgYmV0d2VlbiBhIHN0cmluZyBvZiAwMDEwMTAxMDAxJ3MgYW5kIGJpbmFyeSBiYWNrIGFuZCBmb3J0aCBpcyBwcm9iYWJseSBpbmVmZmljaWVudFxuXHQvL1RPRE86IGdldCByaWQgb2YgdGhpcyBmdW5jdGlvblxuXHRmdW5jdGlvbiB0b0JpblN0cl9vbGQoYml0cyl7XG5cdFx0dmFyIGRhdGEgPSAnJztcblx0XHR2YXIgcGFkID0gKGJpdHMubGVuZ3RoICUgOCkgPyAobmV3IEFycmF5KDEgKyA4IC0gKGJpdHMubGVuZ3RoICUgOCkpKS5qb2luKCcwJykgOiAnJztcblx0XHRiaXRzID0gcGFkICsgYml0cztcblx0XHRmb3IodmFyIGkgPSAwOyBpIDwgYml0cy5sZW5ndGg7IGkrPSA4KXtcblx0XHRcdGRhdGEgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShwYXJzZUludChiaXRzLnN1YnN0cihpLDgpLDIpKVxuXHRcdH1cblx0XHRyZXR1cm4gZGF0YTtcblx0fVxuXG5cdGZ1bmN0aW9uIGdlbmVyYXRlRUJNTF9vbGQoanNvbil7XG5cdFx0dmFyIGVibWwgPSAnJztcblx0XHRmb3IodmFyIGkgPSAwOyBpIDwganNvbi5sZW5ndGg7IGkrKyl7XG5cdFx0XHR2YXIgZGF0YSA9IGpzb25baV0uZGF0YTtcblx0XHRcdGlmKHR5cGVvZiBkYXRhID09ICdvYmplY3QnKSBkYXRhID0gZ2VuZXJhdGVFQk1MX29sZChkYXRhKTtcblx0XHRcdGlmKHR5cGVvZiBkYXRhID09ICdudW1iZXInKSBkYXRhID0gdG9CaW5TdHJfb2xkKGRhdGEudG9TdHJpbmcoMikpO1xuXHRcdFx0XG5cdFx0XHR2YXIgbGVuID0gZGF0YS5sZW5ndGg7XG5cdFx0XHR2YXIgemVyb2VzID0gTWF0aC5jZWlsKE1hdGguY2VpbChNYXRoLmxvZyhsZW4pL01hdGgubG9nKDIpKS84KTtcblx0XHRcdHZhciBzaXplX3N0ciA9IGxlbi50b1N0cmluZygyKTtcblx0XHRcdHZhciBwYWRkZWQgPSAobmV3IEFycmF5KCh6ZXJvZXMgKiA3ICsgNyArIDEpIC0gc2l6ZV9zdHIubGVuZ3RoKSkuam9pbignMCcpICsgc2l6ZV9zdHI7XG5cdFx0XHR2YXIgc2l6ZSA9IChuZXcgQXJyYXkoemVyb2VzKSkuam9pbignMCcpICsgJzEnICsgcGFkZGVkO1xuXG5cdFx0XHRlYm1sICs9IHRvQmluU3RyX29sZChqc29uW2ldLmlkLnRvU3RyaW5nKDIpKSArIHRvQmluU3RyX29sZChzaXplKSArIGRhdGE7XG5cblx0XHR9XG5cdFx0cmV0dXJuIGVibWw7XG5cdH1cblxuXHQvL3dvb3QsIGEgZnVuY3Rpb24gdGhhdCdzIGFjdHVhbGx5IHdyaXR0ZW4gZm9yIHRoaXMgcHJvamVjdCFcblx0Ly90aGlzIHBhcnNlcyBzb21lIGpzb24gbWFya3VwIGFuZCBtYWtlcyBpdCBpbnRvIHRoYXQgYmluYXJ5IG1hZ2ljXG5cdC8vd2hpY2ggY2FuIHRoZW4gZ2V0IHNob3ZlZCBpbnRvIHRoZSBtYXRyb3NrYSBjb210YWluZXIgKHBlYWNlYWJseSlcblxuXHRmdW5jdGlvbiBtYWtlU2ltcGxlQmxvY2soZGF0YSl7XG5cdFx0dmFyIGZsYWdzID0gMDtcblx0XHRpZiAoZGF0YS5rZXlmcmFtZSkgZmxhZ3MgfD0gMTI4O1xuXHRcdGlmIChkYXRhLmludmlzaWJsZSkgZmxhZ3MgfD0gODtcblx0XHRpZiAoZGF0YS5sYWNpbmcpIGZsYWdzIHw9IChkYXRhLmxhY2luZyA8PCAxKTtcblx0XHRpZiAoZGF0YS5kaXNjYXJkYWJsZSkgZmxhZ3MgfD0gMTtcblx0XHRpZiAoZGF0YS50cmFja051bSA+IDEyNykge1xuXHRcdFx0dGhyb3cgXCJUcmFja051bWJlciA+IDEyNyBub3Qgc3VwcG9ydGVkXCI7XG5cdFx0fVxuXHRcdHZhciBvdXQgPSBbZGF0YS50cmFja051bSB8IDB4ODAsIGRhdGEudGltZWNvZGUgPj4gOCwgZGF0YS50aW1lY29kZSAmIDB4ZmYsIGZsYWdzXS5tYXAoZnVuY3Rpb24oZSl7XG5cdFx0XHRyZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShlKVxuXHRcdH0pLmpvaW4oJycpICsgZGF0YS5mcmFtZTtcblxuXHRcdHJldHVybiBvdXQ7XG5cdH1cblxuXHQvLyBoZXJlJ3Mgc29tZXRoaW5nIGVsc2UgdGFrZW4gdmVyYmF0aW0gZnJvbSB3ZXBweSwgYXdlc29tZSByaXRlP1xuXG5cdGZ1bmN0aW9uIHBhcnNlV2ViUChyaWZmKXtcblx0XHR2YXIgVlA4ID0gcmlmZi5SSUZGWzBdLldFQlBbMF07XG5cdFx0XG5cdFx0dmFyIGZyYW1lX3N0YXJ0ID0gVlA4LmluZGV4T2YoJ1xceDlkXFx4MDFcXHgyYScpOyAvL0EgVlA4IGtleWZyYW1lIHN0YXJ0cyB3aXRoIHRoZSAweDlkMDEyYSBoZWFkZXJcblx0XHRmb3IodmFyIGkgPSAwLCBjID0gW107IGkgPCA0OyBpKyspIGNbaV0gPSBWUDguY2hhckNvZGVBdChmcmFtZV9zdGFydCArIDMgKyBpKTtcblx0XHRcblx0XHR2YXIgd2lkdGgsIGhvcml6b250YWxfc2NhbGUsIGhlaWdodCwgdmVydGljYWxfc2NhbGUsIHRtcDtcblx0XHRcblx0XHQvL3RoZSBjb2RlIGJlbG93IGlzIGxpdGVyYWxseSBjb3BpZWQgdmVyYmF0aW0gZnJvbSB0aGUgYml0c3RyZWFtIHNwZWNcblx0XHR0bXAgPSAoY1sxXSA8PCA4KSB8IGNbMF07XG5cdFx0d2lkdGggPSB0bXAgJiAweDNGRkY7XG5cdFx0aG9yaXpvbnRhbF9zY2FsZSA9IHRtcCA+PiAxNDtcblx0XHR0bXAgPSAoY1szXSA8PCA4KSB8IGNbMl07XG5cdFx0aGVpZ2h0ID0gdG1wICYgMHgzRkZGO1xuXHRcdHZlcnRpY2FsX3NjYWxlID0gdG1wID4+IDE0O1xuXHRcdHJldHVybiB7XG5cdFx0XHR3aWR0aDogd2lkdGgsXG5cdFx0XHRoZWlnaHQ6IGhlaWdodCxcblx0XHRcdGRhdGE6IFZQOCxcblx0XHRcdHJpZmY6IHJpZmZcblx0XHR9XG5cdH1cblxuXHQvLyBpIHRoaW5rIGknbSBnb2luZyBvZmYgb24gYSByaWZmIGJ5IHByZXRlbmRpbmcgdGhpcyBpcyBzb21lIGtub3duXG5cdC8vIGlkaW9tIHdoaWNoIGknbSBtYWtpbmcgYSBjYXN1YWwgYW5kIGJyaWxsaWFudCBwdW4gYWJvdXQsIGJ1dCBzaW5jZVxuXHQvLyBpIGNhbid0IGZpbmQgYW55dGhpbmcgb24gZ29vZ2xlIHdoaWNoIGNvbmZvcm1zIHRvIHRoaXMgaWRpb21hdGljXG5cdC8vIHVzYWdlLCBJJ20gYXNzdW1pbmcgdGhpcyBpcyBqdXN0IGEgY29uc2VxdWVuY2Ugb2Ygc29tZSBwc3ljaG90aWNcblx0Ly8gYnJlYWsgd2hpY2ggbWFrZXMgbWUgbWFrZSB1cCBwdW5zLiB3ZWxsLCBlbm91Z2ggcmlmZi1yYWZmIChhaGEgYVxuXHQvLyByZXNjdWUgb2Ygc29ydHMpLCB0aGlzIGZ1bmN0aW9uIHdhcyByaXBwZWQgd2hvbGVzYWxlIGZyb20gd2VwcHlcblxuXHRmdW5jdGlvbiBwYXJzZVJJRkYoc3RyaW5nKXtcblx0XHR2YXIgb2Zmc2V0ID0gMDtcblx0XHR2YXIgY2h1bmtzID0ge307XG5cdFx0XG5cdFx0d2hpbGUgKG9mZnNldCA8IHN0cmluZy5sZW5ndGgpIHtcblx0XHRcdHZhciBpZCA9IHN0cmluZy5zdWJzdHIob2Zmc2V0LCA0KTtcblx0XHRcdHZhciBsZW4gPSBwYXJzZUludChzdHJpbmcuc3Vic3RyKG9mZnNldCArIDQsIDQpLnNwbGl0KCcnKS5tYXAoZnVuY3Rpb24oaSl7XG5cdFx0XHRcdHZhciB1bnBhZGRlZCA9IGkuY2hhckNvZGVBdCgwKS50b1N0cmluZygyKTtcblx0XHRcdFx0cmV0dXJuIChuZXcgQXJyYXkoOCAtIHVucGFkZGVkLmxlbmd0aCArIDEpKS5qb2luKCcwJykgKyB1bnBhZGRlZFxuXHRcdFx0fSkuam9pbignJyksMik7XG5cdFx0XHR2YXIgZGF0YSA9IHN0cmluZy5zdWJzdHIob2Zmc2V0ICsgNCArIDQsIGxlbik7XG5cdFx0XHRvZmZzZXQgKz0gNCArIDQgKyBsZW47XG5cdFx0XHRjaHVua3NbaWRdID0gY2h1bmtzW2lkXSB8fCBbXTtcblx0XHRcdFxuXHRcdFx0aWYgKGlkID09ICdSSUZGJyB8fCBpZCA9PSAnTElTVCcpIHtcblx0XHRcdFx0Y2h1bmtzW2lkXS5wdXNoKHBhcnNlUklGRihkYXRhKSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjaHVua3NbaWRdLnB1c2goZGF0YSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBjaHVua3M7XG5cdH1cblxuXHQvLyBoZXJlJ3MgYSBsaXR0bGUgdXRpbGl0eSBmdW5jdGlvbiB0aGF0IGFjdHMgYXMgYSB1dGlsaXR5IGZvciBvdGhlciBmdW5jdGlvbnNcblx0Ly8gYmFzaWNhbGx5LCB0aGUgb25seSBwdXJwb3NlIGlzIGZvciBlbmNvZGluZyBcIkR1cmF0aW9uXCIsIHdoaWNoIGlzIGVuY29kZWQgYXNcblx0Ly8gYSBkb3VibGUgKGNvbnNpZGVyYWJseSBtb3JlIGRpZmZpY3VsdCB0byBlbmNvZGUgdGhhbiBhbiBpbnRlZ2VyKVxuXHRmdW5jdGlvbiBkb3VibGVUb1N0cmluZyhudW0pe1xuXHRcdHJldHVybiBbXS5zbGljZS5jYWxsKFxuXHRcdFx0bmV3IFVpbnQ4QXJyYXkoXG5cdFx0XHRcdChcblx0XHRcdFx0XHRuZXcgRmxvYXQ2NEFycmF5KFtudW1dKSAvL2NyZWF0ZSBhIGZsb2F0NjQgYXJyYXlcblx0XHRcdFx0KS5idWZmZXIpIC8vZXh0cmFjdCB0aGUgYXJyYXkgYnVmZmVyXG5cdFx0XHQsIDApIC8vIGNvbnZlcnQgdGhlIFVpbnQ4QXJyYXkgaW50byBhIHJlZ3VsYXIgYXJyYXlcblx0XHRcdC5tYXAoZnVuY3Rpb24oZSl7IC8vc2luY2UgaXQncyBhIHJlZ3VsYXIgYXJyYXksIHdlIGNhbiBub3cgdXNlIG1hcFxuXHRcdFx0XHRyZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShlKSAvLyBlbmNvZGUgYWxsIHRoZSBieXRlcyBpbmRpdmlkdWFsbHlcblx0XHRcdH0pXG5cdFx0XHQucmV2ZXJzZSgpIC8vY29ycmVjdCB0aGUgYnl0ZSBlbmRpYW5uZXNzIChhc3N1bWUgaXQncyBsaXR0bGUgZW5kaWFuIGZvciBub3cpXG5cdFx0XHQuam9pbignJykgLy8gam9pbiB0aGUgYnl0ZXMgaW4gaG9seSBtYXRyaW1vbnkgYXMgYSBzdHJpbmdcblx0fVxuXG5cdGZ1bmN0aW9uIFdoYW1teVZpZGVvKHNwZWVkLCBxdWFsaXR5KXsgLy8gYSBtb3JlIGFic3RyYWN0LWlzaCBBUElcblx0XHR0aGlzLmZyYW1lcyA9IFtdO1xuXHRcdHRoaXMuZHVyYXRpb24gPSAxMDAwIC8gc3BlZWQ7XG5cdFx0dGhpcy5xdWFsaXR5ID0gcXVhbGl0eSB8fCAwLjg7XG5cdH1cblxuXHRXaGFtbXlWaWRlby5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24oZnJhbWUsIGR1cmF0aW9uKXtcblx0XHRpZih0eXBlb2YgZHVyYXRpb24gIT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5kdXJhdGlvbikgdGhyb3cgXCJ5b3UgY2FuJ3QgcGFzcyBhIGR1cmF0aW9uIGlmIHRoZSBmcHMgaXMgc2V0XCI7XG5cdFx0aWYodHlwZW9mIGR1cmF0aW9uID09ICd1bmRlZmluZWQnICYmICF0aGlzLmR1cmF0aW9uKSB0aHJvdyBcImlmIHlvdSBkb24ndCBoYXZlIHRoZSBmcHMgc2V0LCB5b3UgbmVkIHRvIGhhdmUgZHVyYXRpb25zIGhlcmUuXCJcblx0XHRpZignY2FudmFzJyBpbiBmcmFtZSl7IC8vQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEXG5cdFx0XHRmcmFtZSA9IGZyYW1lLmNhbnZhcztcdFxuXHRcdH1cblx0XHRpZigndG9EYXRhVVJMJyBpbiBmcmFtZSl7XG5cdFx0XHRmcmFtZSA9IGZyYW1lLnRvRGF0YVVSTCgnaW1hZ2Uvd2VicCcsIHRoaXMucXVhbGl0eSlcblx0XHR9ZWxzZSBpZih0eXBlb2YgZnJhbWUgIT0gXCJzdHJpbmdcIil7XG5cdFx0XHR0aHJvdyBcImZyYW1lIG11c3QgYmUgYSBhIEhUTUxDYW52YXNFbGVtZW50LCBhIENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCBvciBhIERhdGFVUkkgZm9ybWF0dGVkIHN0cmluZ1wiXG5cdFx0fVxuXHRcdGlmICghKC9eZGF0YTppbWFnZVxcL3dlYnA7YmFzZTY0LC9pZykudGVzdChmcmFtZSkpIHtcblx0XHRcdHRocm93IFwiSW5wdXQgbXVzdCBiZSBmb3JtYXR0ZWQgcHJvcGVybHkgYXMgYSBiYXNlNjQgZW5jb2RlZCBEYXRhVVJJIG9mIHR5cGUgaW1hZ2Uvd2VicFwiO1xuXHRcdH1cblx0XHR0aGlzLmZyYW1lcy5wdXNoKHtcblx0XHRcdGltYWdlOiBmcmFtZSxcblx0XHRcdGR1cmF0aW9uOiBkdXJhdGlvbiB8fCB0aGlzLmR1cmF0aW9uXG5cdFx0fSlcblx0fVxuXHRcblx0V2hhbW15VmlkZW8ucHJvdG90eXBlLmNvbXBpbGUgPSBmdW5jdGlvbihvdXRwdXRBc0FycmF5KXtcblx0XHRyZXR1cm4gbmV3IHRvV2ViTSh0aGlzLmZyYW1lcy5tYXAoZnVuY3Rpb24oZnJhbWUpe1xuXHRcdFx0dmFyIHdlYnAgPSBwYXJzZVdlYlAocGFyc2VSSUZGKGF0b2IoZnJhbWUuaW1hZ2Uuc2xpY2UoMjMpKSkpO1xuXHRcdFx0d2VicC5kdXJhdGlvbiA9IGZyYW1lLmR1cmF0aW9uO1xuXHRcdFx0cmV0dXJuIHdlYnA7XG5cdFx0fSksIG91dHB1dEFzQXJyYXkpXG5cdH1cblxuXHRyZXR1cm4ge1xuXHRcdFZpZGVvOiBXaGFtbXlWaWRlbyxcblx0XHRmcm9tSW1hZ2VBcnJheTogZnVuY3Rpb24oaW1hZ2VzLCBmcHMsIG91dHB1dEFzQXJyYXkpe1xuXHRcdFx0cmV0dXJuIHRvV2ViTShpbWFnZXMubWFwKGZ1bmN0aW9uKGltYWdlKXtcblx0XHRcdFx0dmFyIHdlYnAgPSBwYXJzZVdlYlAocGFyc2VSSUZGKGF0b2IoaW1hZ2Uuc2xpY2UoMjMpKSkpXG5cdFx0XHRcdHdlYnAuZHVyYXRpb24gPSAxMDAwIC8gZnBzO1xuXHRcdFx0XHRyZXR1cm4gd2VicDtcblx0XHRcdH0pLCBvdXRwdXRBc0FycmF5KVxuXHRcdH0sXG5cdFx0dG9XZWJNOiB0b1dlYk1cblx0XHQvLyBleHBvc2UgbWV0aG9kcyBvZiBtYWRuZXNzXG5cdH1cbn0pKCk7XG5cbmlmICh0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcpIG1vZHVsZS5leHBvcnRzID0gV2hhbW15O1xuIl19
