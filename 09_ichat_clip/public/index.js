(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
document.addEventListener('DOMContentLoaded', (function() {
  var xhr = new XMLHttpRequest();
  xhr.onload = (function() {
    var video = document.createElement('video');
    video.src = URL.createObjectURL(new Blob([xhr.response], {type: 'video/webm'}));
    video.muted = true;
    video.autoplay = true;
    video.loop = true;
    video.width = window.innerWidth;
    video.height = window.innerHeight;
    video.play();
    document.body.appendChild(video);
  });
  xhr.responseType = 'arraybuffer';
  xhr.open('GET', 'getRecording', true);
  xhr.send(null);
}));



},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMveGVyby9Eb2N1bWVudHMvVGFsa3MvMjAxNV8xMS9jb2RlLzlfaWNoYXQvY2xpZW50L2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFBQSxPQUFPLGlCQUFpQixBQUFDLENBQUMsa0JBQWlCLEdBQUcsU0FBQSxBQUFDO0FBQzdDLEFBQUksSUFBQSxDQUFBLEdBQUUsRUFBSSxJQUFJLGVBQWEsQUFBQyxFQUFDLENBQUE7QUFDN0IsSUFBRSxPQUFPLElBQUksU0FBQSxBQUFDLENBQUs7QUFDakIsQUFBSSxNQUFBLENBQUEsS0FBSSxFQUFJLENBQUEsUUFBTyxjQUFjLEFBQUMsQ0FBQyxPQUFNLENBQUMsQ0FBQTtBQUUxQyxRQUFJLElBQUksRUFBSSxDQUFBLEdBQUUsZ0JBQWdCLEFBQUMsQ0FBQyxHQUFJLEtBQUcsQUFBQyxDQUFDLENBQUMsR0FBRSxTQUFTLENBQUMsQ0FBRyxFQUFDLElBQUcsQ0FBRyxhQUFXLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDOUUsUUFBSSxNQUFNLEVBQUksS0FBRyxDQUFBO0FBQ2pCLFFBQUksU0FBUyxFQUFJLEtBQUcsQ0FBQTtBQUNwQixRQUFJLEtBQUssRUFBSSxLQUFHLENBQUE7QUFDaEIsUUFBSSxNQUFNLEVBQUksQ0FBQSxNQUFLLFdBQVcsQ0FBQTtBQUM5QixRQUFJLE9BQU8sRUFBSSxDQUFBLE1BQUssWUFBWSxDQUFBO0FBQ2hDLFFBQUksS0FBSyxBQUFDLEVBQUMsQ0FBQTtBQUVYLFdBQU8sS0FBSyxZQUFZLEFBQUMsQ0FBQyxLQUFJLENBQUMsQ0FBQTtFQUNqQyxDQUFBLENBQUE7QUFFQSxJQUFFLGFBQWEsRUFBSSxjQUFZLENBQUE7QUFDL0IsSUFBRSxLQUFLLEFBQUMsQ0FBQyxLQUFJLENBQUcsZUFBYSxDQUFHLEtBQUcsQ0FBQyxDQUFBO0FBQ3BDLElBQUUsS0FBSyxBQUFDLENBQUMsSUFBRyxDQUFDLENBQUE7QUFDZixFQUFDLENBQUE7QUFBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xuICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KClcbiAgeGhyLm9ubG9hZCA9ICgpID0+IHtcbiAgICB2YXIgdmlkZW8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd2aWRlbycpXG5cbiAgICB2aWRlby5zcmMgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKG5ldyBCbG9iKFt4aHIucmVzcG9uc2VdLCB7dHlwZTogJ3ZpZGVvL3dlYm0nfSkpXG4gICAgdmlkZW8ubXV0ZWQgPSB0cnVlXG4gICAgdmlkZW8uYXV0b3BsYXkgPSB0cnVlXG4gICAgdmlkZW8ubG9vcCA9IHRydWVcbiAgICB2aWRlby53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoXG4gICAgdmlkZW8uaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0XG4gICAgdmlkZW8ucGxheSgpXG5cbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHZpZGVvKVxuICB9XG5cbiAgeGhyLnJlc3BvbnNlVHlwZSA9ICdhcnJheWJ1ZmZlcidcbiAgeGhyLm9wZW4oJ0dFVCcsICdnZXRSZWNvcmRpbmcnLCB0cnVlKVxuICB4aHIuc2VuZChudWxsKVxufSkiXX0=
