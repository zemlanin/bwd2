import get from 'lodash.get'

self.onmessage = function (msg) {
  switch (msg.data.topic) {
    case 'init':
      init()
      break;
    case 'close':
      close()
      break;
    case 'refresh':
      refresh()
      break;
    case 'fetch':
      fetchMsg(msg.data.payload)
      break;
    default:
      throw 'no topic on incoming message';
  }
}

let timeout = null
let counter = 0
let url = null
let selector = null

function init() {
  // clearTimeout(timeout)
  const rec = () => {
    self.postMessage({
      topic: 'view',
      payload: counter++
    })
    timeout = setTimeout(rec, 500 + 1000 * Math.random())
  }
  rec()
}

function close () {
  if (timeout) {
    clearTimeout(timeout)
    timeout = null
  }
}

function fetchMsg(payload) {
  url = payload.url
  selector = payload.selector

  refresh()
}

function refresh() {
  clearTimeout(timeout)

  fetch(url)
    .then(r => selector ? r.json() : r.text())
    .then(r => self.postMessage({
      topic: 'view',
      payload: (selector ? get(r, selector) : r),
    }))
}
