document.addEventListener('DOMContentLoaded', () => {
  var xhr = new XMLHttpRequest()
  xhr.onload = () => {
    var video = document.createElement('video')

    video.src = URL.createObjectURL(new Blob([xhr.response], {type: 'video/webm'}))
    video.muted = true
    video.autoplay = true
    video.loop = true
    video.width = window.innerWidth
    video.height = window.innerHeight
    video.play()

    document.body.appendChild(video)
  }

  xhr.responseType = 'arraybuffer'
  xhr.open('GET', 'getRecording', true)
  xhr.send(null)
})