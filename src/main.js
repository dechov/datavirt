import 'whatwg-fetch'

import Shake from 'shake.js'
const myShakeEvent = new Shake({ threshold: 15, timeout: 1000 })
myShakeEvent.start()
window.addEventListener('shake', () => document.location.reload(true), false)


import React from 'react'
import ReactDOM from 'react-dom'
import * as d3 from 'd3'

import World from './components/World'


const timeParse = d3.timeParse('%Y,%m,%d')
const transform = d => {
  d.date = +timeParse([d.YEAR, d.MONTH, 1])//, d.DAY])	
  return d
}
fetch('data/FARS2015NationalCSV/accident.csv')
  .then(response => response.text())
  .then(text => d3.csvParse(text, transform))
  .then(accidents => accidents.filter(d => d['LATITUDE'] <= 72))
  .then(accidents => {
    const props = {
      aggregateAccidents:
        // d3.nest().key(d => [d['LATITUDE'], d['date']]).entries(accidents)
        // d3.nest().key(d => [d['date']]).entries(accidents)
        // d3.nest().key(d => [d['LATITUDE']]).entries(accidents)
        d3.nest()
          .key(d => d['LATITUDE'])
          .key(d => d['date'])
          .entries(accidents)
    }
    ReactDOM.render(
      <World {...props} />,
      document.getElementById('container')
    )
  })


const props = {}
ReactDOM.render(
  <World {...props} />,
  document.getElementById('container')
)
