import 'whatwg-fetch'

// Shake to reload
import Shake from 'shake.js'
const myShakeEvent = new Shake({ threshold: 15, timeout: 1000 })
myShakeEvent.start()
window.addEventListener('shake', () => document.location.reload(true), false)


import React from 'react'
import ReactDOM from 'react-dom'
import * as d3 from 'd3'

import World from './components/World'


let state = {}

const update = (state, action) => {
  switch (action.type) {
    case 'aggregate':
      return {
        ...state,
        aggregates: d3.merge(
          d3.nest()
            .key(d => d['LATITUDE']).key(d => d['date'])
            .rollup(values => ({
              LATITUDE: values[0].LATITUDE,
              date: values[0].date,
              length: values.length,
            }))
            .entries(action.accidents)
            .map(row => row.values)
        )
      }
    case 'loadAggregates':
      return { ...state, aggregates: action.aggregates }
    default:
      return state
  }
}

const dispatch = action => render(state = update(state, action)) 

const handlers = {}

const render = state => {
  const props = {
    aggregates: state.aggregates,
  }
  ReactDOM.render(
    <World {...props} {...handlers} />,
    document.getElementById('container')
  )
}


// const timeParse = d3.timeParse('%Y,%m,%d')
// const transform = d => {
//   d.date = +timeParse([d.YEAR, d.MONTH, 1])//, d.DAY])	
//   return d
// }
// fetch('data/FARS2015NationalCSV/accident.csv')
//   .then(response => response.text())
//   .then(text => d3.csvParse(text, transform))
//   .then(accidents => accidents.filter(d => d['LATITUDE'] >= 22 && d['LATITUDE'] <= 49))
//   .then(accidents => { dispatch({ type: 'aggregate', accidents }) })

fetch('data/aggregates.json')
  .then(response => response.json())
  .then(aggregates => { dispatch({ type: 'loadAggregates', aggregates }) })


dispatch({ type: '__init' })
