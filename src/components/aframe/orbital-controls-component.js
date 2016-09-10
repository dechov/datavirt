/*
 * Forked from look-controls, modified updatePosition
 */


// var registerComponent = require('../core/component').registerComponent;
// var THREE = require('../lib/three');
// var isMobile = require('../utils/').isMobile();
// var bind = require('../utils/bind');
// var bind = AFRAME.utils.bind
var bind = (f, context) => f.bind(context)
var isMobile = AFRAME.utils.isMobile()

// To avoid recalculation at every mouse movement tick
var PI_2 = Math.PI / 2;
var radToDeg = THREE.Math.radToDeg;
var degToRad = THREE.Math.degToRad;

module.exports.Component = AFRAME.registerComponent('orbital-controls', {
  dependencies: ['position', 'rotation'],

  schema: {
    enabled: {default: true},
    hmdEnabled: {default: true},
    standing: {default: true},
    pivot: {type: 'vec3'},
    radius: {default: 1},
  },

  init: function () {
    var sceneEl = this.el.sceneEl;

    this.previousHMDPosition = new THREE.Vector3();
    this.setupMouseControls();
    this.setupHMDControls();
    this.bindMethods();

    // Enable grab cursor class on canvas.
    function enableGrabCursor () { sceneEl.canvas.classList.add('a-grab-cursor'); }
    if (!sceneEl.canvas) {
      sceneEl.addEventListener('render-target-loaded', enableGrabCursor);
    } else {
      enableGrabCursor();
    }
  },

  update: function (oldData) {
    var data = this.data;
    var hmdEnabled = data.hmdEnabled;
    if (!data.enabled) { return; }
    if (!hmdEnabled && oldData && hmdEnabled !== oldData.hmdEnabled) {
      this.pitchObject.rotation.set(0, 0, 0);
      this.yawObject.rotation.set(0, 0, 0);
    }
    this.controls.standing = data.standing;
    this.controls.update();
    this.updateOrientation();
    this.updatePosition();
  },

  play: function () {
    this.addEventListeners();
  },

  pause: function () {
    this.removeEventListeners();
  },

  tick: function (t) {
    this.update();
  },

  remove: function () {
    this.pause();
  },

  bindMethods: function () {
    this.onMouseDown = bind(this.onMouseDown, this);
    this.onMouseMove = bind(this.onMouseMove, this);
    this.releaseMouse = bind(this.releaseMouse, this);
    this.onTouchStart = bind(this.onTouchStart, this);
    this.onTouchMove = bind(this.onTouchMove, this);
    this.onTouchEnd = bind(this.onTouchEnd, this);
  },

  setupMouseControls: function () {
    // The canvas where the scene is painted
    this.mouseDown = false;
    this.pitchObject = new THREE.Object3D();
    this.yawObject = new THREE.Object3D();
    this.yawObject.position.y = 10;
    this.yawObject.add(this.pitchObject);
  },

  setupHMDControls: function () {
    this.dolly = new THREE.Object3D();
    this.euler = new THREE.Euler();
    this.controls = new THREE.VRControls(this.dolly);
    this.controls.userHeight = 0.0;
  },

  addEventListeners: function () {
    var sceneEl = this.el.sceneEl;
    var canvasEl = sceneEl.canvas;

    // listen for canvas to load.
    if (!canvasEl) {
      sceneEl.addEventListener('render-target-loaded', bind(this.addEventListeners, this));
      return;
    }

    // Mouse Events
    canvasEl.addEventListener('mousedown', this.onMouseDown, false);
    window.addEventListener('mousemove', this.onMouseMove, false);
    window.addEventListener('mouseup', this.releaseMouse, false);

    // Touch events
    canvasEl.addEventListener('touchstart', this.onTouchStart);
    window.addEventListener('touchmove', this.onTouchMove);
    window.addEventListener('touchend', this.onTouchEnd);
  },

  removeEventListeners: function () {
    var sceneEl = this.el.sceneEl;
    var canvasEl = sceneEl && sceneEl.canvas;
    if (!canvasEl) { return; }

    // Mouse Events
    canvasEl.removeEventListener('mousedown', this.onMouseDown);
    canvasEl.removeEventListener('mousemove', this.onMouseMove);
    canvasEl.removeEventListener('mouseup', this.releaseMouse);
    canvasEl.removeEventListener('mouseout', this.releaseMouse);

    // Touch events
    canvasEl.removeEventListener('touchstart', this.onTouchStart);
    canvasEl.removeEventListener('touchmove', this.onTouchMove);
    canvasEl.removeEventListener('touchend', this.onTouchEnd);
  },

  updateOrientation: (function () {
    var hmdEuler = new THREE.Euler();
    return function () {
      var currentRotation;
      var deltaRotation;
      var pitchObject = this.pitchObject;
      var yawObject = this.yawObject;
      var hmdQuaternion = this.calculateHMDQuaternion();
      var sceneEl = this.el.sceneEl;
      var rotation;
      hmdEuler.setFromQuaternion(hmdQuaternion, 'YXZ');
      if (isMobile) {
        // In mobile we allow camera rotation with touch events and sensors
        rotation = {
          x: radToDeg(hmdEuler.x) + radToDeg(pitchObject.rotation.x),
          y: radToDeg(hmdEuler.y) + radToDeg(yawObject.rotation.y),
          z: radToDeg(hmdEuler.z)
        };
      } else if (!sceneEl.is('vr-mode') || isNullVector(hmdEuler) || !this.data.hmdEnabled) {
        // currentRotation = this.el.getComputedAttribute('rotation');
        currentRotation = this.rotation || {x: 0, y: 0, z: 0};
        deltaRotation = this.calculateDeltaRotation();
        // Mouse look only if HMD disabled or no info coming from the sensors
        rotation = {
          x: currentRotation.x + deltaRotation.x,
          y: currentRotation.y + deltaRotation.y,
          z: currentRotation.z
        };
      } else {
        // Mouse rotation ignored with an active headset.
        // The user head rotation takes priority
        rotation = {
          x: radToDeg(hmdEuler.x),
          y: radToDeg(hmdEuler.y),
          z: radToDeg(hmdEuler.z)
        };
      }
      this.el.setAttribute('rotation', rotation);
      this.rotation = rotation;
    };
  })(),

  calculateDeltaRotation: (function () {
    var previousRotationX;
    var previousRotationY;
    return function () {
      var currentRotationX = radToDeg(this.pitchObject.rotation.x);
      var currentRotationY = radToDeg(this.yawObject.rotation.y);
      var deltaRotation;
      previousRotationX = previousRotationX || currentRotationX;
      previousRotationY = previousRotationY || currentRotationY;
      deltaRotation = {
        x: currentRotationX - previousRotationX,
        y: currentRotationY - previousRotationY
      };
      previousRotationX = currentRotationX;
      previousRotationY = currentRotationY;
      return deltaRotation;
    };
  })(),

  calculateHMDQuaternion: (function () {
    var hmdQuaternion = new THREE.Quaternion();
    return function () {
      hmdQuaternion.copy(this.dolly.quaternion);
      return hmdQuaternion;
    };
  })(),

  updatePosition: (function () {
    var position = new THREE.Vector3();
    var orientation = new THREE.Vector3();

    return function () {
      var el = this.el;

      const phi = degToRad(this.rotation.x)
      const theta = degToRad(this.rotation.y)

      orientation.x = -Math.sin(theta) * Math.cos(phi)
      orientation.y = Math.sin(phi)
      orientation.z = -Math.cos(theta) * Math.cos(phi)

      orientation.multiplyScalar(this.data.radius)
      position.copy(this.data.pivot).sub(orientation)
      el.setAttribute('position', {
        x: position.x,
        y: position.y,
        z: position.z,
      });
    };
  })(),

  calculateHMDPosition: function () {
    var dolly = this.dolly;
    var position = new THREE.Vector3();
    dolly.updateMatrix();
    position.setFromMatrixPosition(dolly.matrix);
    return position;
  },

  onMouseMove: function (event) {
    var pitchObject = this.pitchObject;
    var yawObject = this.yawObject;
    var previousMouseEvent = this.previousMouseEvent;

    if (!this.mouseDown || !this.data.enabled) { return; }

    var movementX = event.movementX || event.mozMovementX;
    var movementY = event.movementY || event.mozMovementY;

    if (movementX === undefined || movementY === undefined) {
      movementX = event.screenX - previousMouseEvent.screenX;
      movementY = event.screenY - previousMouseEvent.screenY;
    }
    this.previousMouseEvent = event;

    yawObject.rotation.y -= movementX * 0.002;
    pitchObject.rotation.x -= movementY * 0.002;
    pitchObject.rotation.x = Math.max(-PI_2, Math.min(PI_2, pitchObject.rotation.x));
  },

  onMouseDown: function (event) {
    this.mouseDown = true;
    this.previousMouseEvent = event;
    document.body.classList.add('a-grabbing');
  },

  releaseMouse: function () {
    this.mouseDown = false;
    document.body.classList.remove('a-grabbing');
  },

  onTouchStart: function (e) {
    if (e.touches.length !== 1) { return; }
    this.touchStart = {
      x: e.touches[0].pageX,
      y: e.touches[0].pageY
    };
    this.touchStarted = true;
  },

  onTouchMove: function (e) {
    var deltaY;
    var yawObject = this.yawObject;
    if (!this.touchStarted) { return; }
    deltaY = 2 * Math.PI * (e.touches[0].pageX - this.touchStart.x) /
            this.el.sceneEl.canvas.clientWidth;
    // Limits touch orientaion to to yaw (y axis)
    yawObject.rotation.y -= deltaY * 0.5;
    this.touchStart = {
      x: e.touches[0].pageX,
      y: e.touches[0].pageY
    };
  },

  onTouchEnd: function () {
    this.touchStarted = false;
  }
});

function isNullVector (vector) {
  return vector.x === 0 && vector.y === 0 && vector.z === 0;
}
