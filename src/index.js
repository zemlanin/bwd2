import m from 'mithril'
import 'drag-drop-webkit-mobile'

window.addEventListener('touchmove', () => {})

const SIZE_COLUMNS = 10
const SIZE_ROWS = 10

const state = {
  widgets: [
    {
      text: 'lorem ipsum',
      row: '1',
      column: '1 / 4',
    },
    {
      text: 'lorem ipsum',
      row: '2 / 5',
      column: '3',
    },
  ],
  visibleGaps: true,
  newWidget: null,
  occupied: null,
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
      parseInt(placeholderRow),
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
      parseInt(placeholderColumn),
    ]
  } else if (state.newWidget.startColumn > placeholderColumn) {
    potentialNewWidget.columns = [
      parseInt(placeholderColumn),
      state.newWidget.startColumn + 1,
    ]
  }

  for (let i = potentialNewWidget.rows[0]; i < potentialNewWidget.rows[1]; i++) {
    for (let j = potentialNewWidget.columns[0]; j < potentialNewWidget.columns[1]; j++) {
      if (state.occupied && state.occupied[i - 1][j - 1]) {
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

function finishNewWidget (e) {
  if (!state.newWidget) {
    return
  }

  state.widgets.push({
    row: state.newWidget.rows.join('/'),
    column: state.newWidget.columns.join('/'),
    text: state.newWidget.rows.join('/') + ':' + state.newWidget.columns.join('/')
  })
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

const app = {
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
      state.visibleGaps ? generatePlaceholders(state) : [],
      state.widgets.map((w, i) =>
        m('div',
          {style: {
            gridColumn: w.column,
            gridRow: w.row,
            outline: '1px solid black',
            overflow: 'auto',
          }},
          w.text
        )
      ),
      m('div',
        {
          style: {
            gridColumn: SIZE_COLUMNS,
            gridRow: '1',
            outline: '1px solid black',
            textAlign: 'center',
            cursor: 'pointer',
            paddingTop: 'calc(5vh - 1em)',
            color: state.visibleGaps ? 'red' : 'black',
            backgroundColor: state.visibleGaps ? 'transparent' : 'red',
          },
          onclick: () => state.visibleGaps = !state.visibleGaps,
        },
        'edit'
      )
    )
  }
}

m.mount(document.getElementById('app'), app)
