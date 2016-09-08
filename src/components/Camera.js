import React from 'react'
import { Entity } from 'aframe-react'

// import 'aframe-orbit-controls-component'

export default props => (
  <Entity>
    <Entity
      camera=""
      look-controls=""
      wasd-controls=""
      // orbit-controls={{ enabled: true, target: '#target' }}
      {...props}
    />
  </Entity>
);
