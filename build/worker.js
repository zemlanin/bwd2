self.onmessage = function (msg) {
  switch (msg.data.topic) {
    case 'init':
      init()
      break;
    case 'close':
      close()
      break;
    default:
      throw 'no topic on incoming message';
  }
}

let timeout = null
let counter = 0

function init() {
  const rec = () => {
    self.postMessage({
      topic: 'view',
      payload: counter++
    })
    timeout = setTimeout(rec, 160)
  }
  rec()
}

function close () {
  if (timeout) {
    clearTimeout(timeout)
    timeout = null
  }
}
