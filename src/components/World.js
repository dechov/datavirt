import AFRAME from 'aframe'
import 'aframe-faceset-component'
import './aframe/line-component'
import './aframe/orbital-controls-component'

import React from 'react'
import { Scene, Entity, Animation } from 'aframe-react'
import * as d3 from 'd3'
import LOESS from 'loess'
// var LOESS = require('loess')

import Camera from './Camera'
import Cursor from './Cursor'
import Sky from './Sky'


class World extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      orbit: true
    }

    // document.body.addEventListener('touchstart', () => {
    //   this.setState({ orbit: true })
    //   console.log({ orbit: true })
    // })
    // document.body.addEventListener('touchend', () => {
    //   this.setState({ orbit: false })
    //   console.log({ orbit: false })
    // })

  }

  render() {
    const aggregates = this.props.aggregateAccidents || []
    if (!aggregates.length) return null

    const values = d3.merge(aggregates.map(row => row.values))
    const latitudeScale = d3.scaleLinear()
      .domain(d3.extent(values, d => d.values[0]['LATITUDE']))
      .range([-3, 3])
    const dateScale = d3.scaleTime()
      .domain(d3.extent(values, d => d.values[0]['date']))
      .range([0, 10])
    const countScale = d3.scaleLinear()
      .domain([0, d3.max(values, d => d.values.length)])
      .range([0, 3])

    const sampleValues = d3.range(0, 20)
      .map(() => Math.floor(Math.random()*values.length))
      .map(i => values[i])
    

    console.time('loess')
    const model = new LOESS({
      x: values.map(d => latitudeScale(d.values[0]['LATITUDE'])),
      x2: values.map(d => dateScale(d.values[0]['date'])),
      y: values.map(d => countScale(d.values.length)),
    }/*, {span: 0.5, band: 0.8, degree: 1}*/)

    const grid = model.grid([30, 30])
    const vertices = d3.zip(grid.x, model.predict(grid).fitted, grid.x2)
    console.timeEnd('loess')

    // <Cursor fuse={false} />
    return (
      <a-scene>
        <Entity geometry={{primitive: 'sphere', radius: 1000}}
                material={{color: '#0A000F', shader: 'flat'}}
                scale="1 1 -1"/>

        <Entity
          camera=""
          look-controls={{ enabled: !this.state.orbit }}
          orbital-controls={{ enabled: this.state.orbit, pivot: '0 1 5', radius: 13.75 }}
          // wasd-controls=""
        />

        <Entity light={{type: 'hemisphere', color: '#AFA', groundColor: '#3C3' }} />
        <Entity light={{type: 'directional', intensity: 1.5, color: '#AFA'}} position={[0, 5, 0]} />

        <Entity
          // geometry={{ primitive: 'plane', width: 1000, height: 1000 }}
          // material={{ color: 'green', side: 'double' }}
          // rotate={[0, 0, 90]}
        />

        <Entity>{
          sampleValues.map(d =>
            <Entity
              key={d.values[0].LATITUDE + d.values[0].date}
              geometry={{ primitive: 'sphere', radius: 0.075 }}
              material={{ color: 'blue' }}
              position={[
                latitudeScale(d.values[0].LATITUDE),
                countScale(d.values.length),
                dateScale(d.values[0].date)
              ]}
            />
          )
        }</Entity>

        <Entity
          faceset={{ vertices: vertices.map(v => v.join(' ')).join(',') }}
          material={{ color: '#888', side: 'double', opacity: 0.75, transparent: true }}
        />

        <Entity>
          <Entity line={{ path: `${latitudeScale.range()[0]} 0 0, ${latitudeScale.range()[1]} 0 0` }} />
          <Entity line={{ path: `0 ${countScale.range()[0]} 0, 0 ${countScale.range()[1]} 0` }} />
          <Entity line={{ path: `0 0 ${dateScale.range()[0]}, 0 0 ${dateScale.range()[1]}` }} />
        </Entity>

      </a-scene>
    )
  }
}

export default World


/*
  <a-assets>
    <a-asset-item id="pony-obj" src="assets/pony/Pony_cartoon.obj" />
    <a-asset-item id="pony-mtl" src="assets/pony/Pony_cartoon.mtl" />
  </a-assets>
  <a-entity
    obj-model="obj: #pony-obj; mtl: #pony-mtl"
    scale="0.001 0.001 0.001"
    position="-5 0 -5"
  >
    <Animation attribute="rotation" dur="5000" repeat="indefinite" to="0 360 360"/>
  </a-entity>
*/


/*
  <Entity
    geometry="primitive: sphere"
    material={{color: this.state.color}}
    onMouseDown={this.changeColor}
    position={[0, 0, -5]}
  >
    <Animation attribute="position" direction="alternate" dur="3000" repeat="indefinite" to={[0, 2, -5]} />
  </Entity>
*/