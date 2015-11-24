require('whammy')

document.addEventListener('DOMContentLoaded', () => {
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia

  window.URL = window.URL || window.webkitURL
  window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame
  window.cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame
  
  navigator.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        minWidth: 1024,
        maxWidth: 1920,

        minHeight: 576,
        maxHeight: 1080
      }
    }
  }, (stream) => {
    var canvas = document.createElement('canvas')
    var context = canvas.getContext('2d')
    var video = document.createElement('video')

    video.src = URL.createObjectURL(stream)
    video.muted = true
    video.play()

    var frames = []
    var whammyVideo = new Whammy.Video()
    var drawTimeout

    video.addEventListener('canplay', () => {
      setTimeout(() => {
        cancelAnimationFrame(drawTimeout)
        stream.getTracks()[0].stop()

        whammyVideo.frames = frames.slice(0)

        var blob = whammyVideo.compile()
        var xhr = new XMLHttpRequest()

        xhr.onload = () => {
          alert('OK!')
        }

        xhr.open('POST', 'saveRecording', true)
        xhr.send(blob)
      }, 5000)

      var lastTime = new Date().getTime()

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      function draw() {
        var duration = new Date().getTime() - lastTime

        lastTime = new Date().getTime()

        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        frames.push({
          duration: duration,
          image: canvas.toDataURL('image/webp', 0.8)
        })

        drawTimeout = requestAnimationFrame(draw)
      }

      drawTimeout = requestAnimationFrame(draw)
    })
  }, function(err) {
    console.log("The following error occured: " + err.name);
  })
})