import m from 'mithril'
import 'drag-drop-webkit-mobile'

window.addEventListener('touchmove', () => {})

const SIZE_COLUMNS = 10
const SIZE_ROWS = 10

const state = {
  widgets: [
    {
      id: '8ed1cf7f-b5c9-4750-acd7-df459725096d',
      text: 'lorem ipsum',
      row: '1',
      column: '1 / 4',
      script: '/worker.js',
    },
    {
      id: 'cda628b0-e2a9-4033-a681-175e23371e8e',
      text: 'lorem ipsum',
      row: '2 / 5',
      column: '3',
      script: '/worker.js',
    },
  ],
  editMode: false,
  newWidget: null,
  occupied: null,
  workers: []
}

function calculateNewWidget(e) {
  if (e.which != 1) {
    if (state.newWidget) {
      state.newWidget = null
    }
    return
  }

  if (!state.newWidget) {
    return
  }

  const placeholderRow = e.target.dataset.placeholderRow
  const placeholderColumn = e.target.dataset.placeholderColumn

  const potentialNewWidget = {
    rows: [],
    columns: [],
  }

  if (state.newWidget.startRow < placeholderRow) {
    potentialNewWidget.rows = [
      state.newWidget.startRow,
      parseInt(placeholderRow) + 1,
    ]
  } else if (state.newWidget.startRow == placeholderRow) {
    potentialNewWidget.rows = [
      parseInt(placeholderRow),
      parseInt(placeholderRow) + 1,
    ]
  } else if (state.newWidget.startRow > placeholderRow) {
    potentialNewWidget.rows = [
      parseInt(placeholderRow),
      state.newWidget.startRow + 1,
    ]
  }

  if (state.newWidget.startColumn < placeholderColumn) {
    potentialNewWidget.columns = [
      state.newWidget.startColumn,
      parseInt(placeholderColumn) + 1,
    ]
  } else if (state.newWidget.startColumn == placeholderColumn) {
    potentialNewWidget.columns = [
      parseInt(placeholderColumn),
      parseInt(placeholderColumn) + 1,
    ]
  } else if (state.newWidget.startColumn > placeholderColumn) {
    potentialNewWidget.columns = [
      parseInt(placeholderColumn),
      state.newWidget.startColumn + 1,
    ]
  }

  for (let i = potentialNewWidget.rows[0] - 1; i < potentialNewWidget.rows[1] - 1; i++) {
    for (let j = potentialNewWidget.columns[0] - 1; j < potentialNewWidget.columns[1] - 1; j++) {
      if (state.occupied && state.occupied[i] && state.occupied[i][j]) {
        m.redraw()
        return
      }
    }
  }

  state.newWidget.rows = potentialNewWidget.rows
  state.newWidget.columns = potentialNewWidget.columns

  m.redraw()
}

function startNewWidget (e) {
  if (state.newWidget) {
    state.newWidget = null
    return
  }

  const r = parseInt(e.target.dataset.placeholderRow)
  const c = parseInt(e.target.dataset.placeholderColumn)

  state.newWidget = {
    rows: [r, r],
    columns: [c, c],
    startRow: r,
    startColumn: c,
  }
}

function registerWorker (widget) {
  if (widget.script && !state.workers.find(worker => worker.id == widget.id)) {
    const worker = new Worker(widget.script)

    state.workers.push({
      id: widget.id,
      worker: worker,
    })

    worker.onmessage = ({data}) => {
      switch (data.topic) {
        case 'view':
          widget.text = data.payload
          m.redraw()
      }
    }

    worker.postMessage({
      topic: 'init',
    })
  }
}

function finishNewWidget (e) {
  if (!state.newWidget) {
    return
  }

  const newWidget = {
    id: Math.random().toString(),
    row: state.newWidget.rows.join('/'),
    column: state.newWidget.columns.join('/'),
    text: state.newWidget.rows.join('/') + ':' + state.newWidget.columns.join('/'),
    script: '/worker.js',
  }

  state.widgets.push(newWidget)
  registerWorker(newWidget)
  state.newWidget = null
}

function generatePlaceholders (state) {
  const placeholders = []
  const occupied = Array.from({length: SIZE_ROWS}, () =>
    Array.from({length: SIZE_COLUMNS}, () => false)
  )

  occupied[0][SIZE_COLUMNS - 1] = true
  
  for (const w of state.widgets) {
    let splitRow = w.row.toString().split('/')
    let splitColumn = w.column.toString().split('/')
    if (splitRow.length == 2 && splitRow[0].trim() !== splitRow[1].trim()) {
      splitRow = Array.from({length: SIZE_ROWS}, (_, i) => i + 1)
        .filter(i => parseInt(splitRow[0]) <= i && i < parseInt(splitRow[1]))
    } else {
      splitRow = [parseInt(splitRow[0])]
    }

    if (splitColumn.length == 2 && splitColumn[0].trim() !== splitColumn[1].trim()) {
      splitColumn = Array.from({length: SIZE_COLUMNS}, (_, i) => i + 1)
        .filter(i => parseInt(splitColumn[0]) <= i && i < parseInt(splitColumn[1]))
    } else {
      splitColumn = [parseInt(splitColumn[0])]
    }

    for (const i of splitColumn) {
      for (const j of splitRow) {
        occupied[j - 1][i - 1] = true
      }
    }
  }

  state.occupied = occupied

  return occupied.map((o, r) => o.map((o_, c) => o_ ? null : m(
    'div',
    {
      draggable: true,
      'data-placeholder-row': r + 1,
      'data-placeholder-column': c + 1,
      style: {
        gridRow: r + 1,
        gridColumn: c + 1,
        textAlign: 'center',
        backgroundColor: 'rgba(255,0,0,0.2)',
        cursor: 'pointer',
      },
      onmouseenter: calculateNewWidget,
      onmousedown: startNewWidget,
      onmouseup: finishNewWidget,
      ondragstart: e => e.preventDefault(),
    }
  )))
}

const Widget = {
  view: ({attrs}) => {
    return m('div',
      {style: {
        gridColumn: attrs.column,
        gridRow: attrs.row,
        outline: '1px solid black',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: `1fr`,
        gridTemplateRows: `1fr`,
      }},
      m('div',
        {
          key: 'view',
          style: {
            gridRow: 1,
            gridColumn: 1,
            filter: state.editMode ? 'blur(5px)' : null,
            zIndex: 1,
          }
        },
        attrs.text
      ),
      state.editMode ? m('div',
        {
          key: 'editActions',
          style: {
            backgroundColor: 'rgba(0,0,0,0.1)',
            gridRow: 1,
            gridColumn: 1,
            zIndex: 2,
          }
        },
        m('button', {
          onclick: () => {
            const worker = state.workers.find(w => w.id === attrs.id)

            if (worker) {
              worker.worker.postMessage({topic: 'close'})
              setTimeout(() => {
                worker.worker.terminate()
                state.workers = state.workers.filter(w => w.id !== attrs.id)
              }, 1000)
            }

            state.widgets = state.widgets.filter(w => w.id !== attrs.id)
          }
        }, 'delete')
      ) : null
    )
  }
}

const app = {
  oninit: () => {
    for (const w of state.widgets) {
      registerWorker(w)
    }
  },
  view: () => {
    return m('div',
      {style: {
        width: 'calc(100vw - 1em)',
        display: 'grid',
        gridTemplateColumns: `repeat(${SIZE_ROWS}, calc((100vw / ${SIZE_COLUMNS}) - 0.55em))`,
        gridTemplateRows: `repeat(${SIZE_COLUMNS}, calc((100vh / ${SIZE_ROWS}) - 0.55em))`,
        gridColumnGap: '0.5em',
        gridRowGap: '0.5em',
        height: 'calc(100vh - 1em)',
      }},
      state.newWidget ? m('div',
        {
          style: {
            gridRow: state.newWidget.rows.join('/'),
            gridColumn: state.newWidget.columns.join('/'),
            outline: '1px solid black',
            overflow: 'auto',
          },
          onclick: () => { state.newWidget = null },
        },
        'new'
      ) : null,
      state.editMode ? generatePlaceholders(state) : [],
      state.widgets.map((w) => {
        return m(Widget, Object.assign({key: w.id}, w))
      }),
      m('div',
        {
          style: {
            gridColumn: SIZE_COLUMNS,
            gridRow: '1',
            outline: '1px solid black',
            textAlign: 'center',
            cursor: 'pointer',
            paddingTop: 'calc(5vh - 1em)',
            color: state.editMode ? 'red' : 'black',
          },
          onclick: () => state.editMode = !state.editMode,
        },
        'edit'
      )
    )
  }
}

m.mount(document.getElementById('app'), app)
