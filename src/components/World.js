import AFRAME from 'aframe'
import 'aframe-faceset-component'
import 'aframe-text-component'
import './aframe/line-component'
import './aframe/orbital-controls-component'

import React from 'react'
import { Scene, Entity } from 'aframe-react'
import * as d3 from 'd3'
// import LOESS from 'loess'

// import Cursor from './Cursor'


class World extends React.Component {
  // constructor(props) {
  //   super(props)
  //   this.state = { orbit: true }
  //   document.body.addEventListener('touchstart', () => { this.setState({ orbit: true }) })
  //   document.body.addEventListener('touchend', () => { this.setState({ orbit: false }) })
  // }

  render() {
    const { aggregates } = this.props
    if (!aggregates.length) return null

    const latitudeScale = d3.scaleLinear()
      .domain(d3.extent(aggregates, d => d.value['LATITUDE']))
      .range([3, -3])
    const dateScale = d3.scaleTime()
      .domain(d3.extent(aggregates, d => d.value['date']))
      .range([0, -10])
    const countScale = d3.scaleLinear()
      .domain([0, d3.max(aggregates, d => d.value.length)])
      .range([0, 3])

    const samples = d3.range(0, 20)
      .map(() => Math.floor(Math.random() * aggregates.length))
      .map(i => aggregates[i])
    
    
    let vertices = aggregates.map(d => [
      latitudeScale(d.value['LATITUDE']),
      countScale(d.value.length),
      dateScale(d.value['date']),
    ])

    // console.time('LOESS')
    // const vertices_T = d3.transpose(vertices)
    // const model = new LOESS({
    //   x: vertices_T[0], x2: vertices_T[2], y: vertices_T[1],
    // }/*, {span: 0.5, band: 0.8, degree: 1}*/)
    // const grid = model.grid([30, 30])
    // // vertices = d3.transpose([grid.x, model.predict(grid).fitted, grid.x2])
    // console.timeEnd('LOESS')
    

    return (
      <Scene>

        {/* Lights */}
        <Entity light={{type: 'hemisphere', color: '#AFA', groundColor: '#3C3' }} />
        <Entity light={{type: 'directional', intensity: 1.5, color: '#AFA'}} position={[0, 15, 0]} />

        {/* Camera */}
        <Entity
          camera=""
          // look-controls={{ enabled: !this.state.orbit }}
          orbital-controls={{ enabled: /*this.state.orbit*/ true, pivot: '0 1 -5', radius: 13.75 }}
        >
          {/* <Cursor fuse={false} /> */}
        </Entity>


        {/* Sky */}
        <Entity
          geometry={{ primitive: 'sphere', radius: 1000 }}
          material={{ color: '#0A000F', shader: 'flat' }}
          scale="1 1 -1"
        />

        {/* Axes */}
        <Entity>
          {/* X */}
          <Entity line={{ path: `${latitudeScale.range()[0]} 0 0, ${latitudeScale.range()[1]} 0 0` }} />
          <Entity
            text={{ text: 'South', size: 0.25 }}
            material={{ color: '#888888', shader: 'flat' }}
            position={[latitudeScale.range()[0] + 0.2, 0, 0]}
          />
          <Entity
            text={{ text: 'North', size: 0.25 }}
            material={{ color: '#888888', shader: 'flat' }}
            position={[latitudeScale.range()[1] - 1, 0, 0]}
          />
          
          {/* Y */}
          <Entity line={{ path: `0 ${countScale.range()[0]} 0, 0 ${countScale.range()[1]} 0` }} />
          <Entity
            text={{ text: 'Fatal auto accidents', size: 0.25 }}
            material={{ color: '#888888', shader: 'flat' }}
            position={[-1.5, countScale.range()[1] + 0.2, 0]}
          />

          {/* Z */}
          <Entity line={{ path: `0 0 ${dateScale.range()[0]}, 0 0 ${dateScale.range()[1]}` }} />
          <Entity
            text={{ text: 'December', size: 0.25 }}
            material={{ color: '#888888', shader: 'flat' }}
            position={[0, 0, dateScale.range()[1] - 0.2]}
            rotation={[0, 90, 0]}
          />
          <Entity
            text={{ text: 'January', size: 0.25 }}
            material={{ color: '#888888', shader: 'flat' }}
            position={[0, 0, dateScale.range()[0] + 0.2]}
            rotation={[0, -90, 0]}
          />

        </Entity>

        {/* Surface */}
        <Entity
          faceset={{ vertices: vertices.map(v => v.join(' ')).join(',') }}
          material={{ color: '#888', side: 'double', opacity: 0.82, transparent: true }}
        />

        {/* Points */}
        <Entity>{
          samples.map(d =>
            <Entity
              key={[d.value.LATITUDE, d.value.date]}
              geometry={{ primitive: 'sphere', radius: 0.075 }}
              material={{ color: 'blue' }}
              position={[
                latitudeScale(d.value.LATITUDE),
                countScale(d.value.length),
                dateScale(d.value.date)
              ]}
            />
          )
        }</Entity>

      </Scene>
    )
  }
}

World.defaultProps = {
  aggregates: [],
}

export default World
