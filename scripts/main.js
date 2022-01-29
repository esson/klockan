import Vector from './vector.js';

// HTML Elements
//

/**
 * @type HTMLCanvasElement
 */
const canvas = document.getElementById('canvas');
const container = document.getElementById('container');

// Variables
//

const ctx = canvas.getContext('2d');

/**
 * The base canvas size, for which the original clock face was drawn. 
 * Used for scaling the canvas to handle resize.
 */
const baseCanvasSize = new Vector(1000);

/**
 * The scale that the canvas should draw in.
 */
let scale = new Vector(1);

const clockRadius = baseCanvasSize.y / 2 * 0.9;
const clockCenter = baseCanvasSize.divide(2);
const clockBackgroundColor = 'white';
const clockPadding = 20;

const smoothMovement = true;

// Timer Settings
const timerStartAngle = -Math.PI / 2;

let timerStarted = false;
let timerElapsed = 0;
let timerLimit = 0;
let timerWedgeSize = 0;

/**
 * Properties for the minute marker.
 */
const minorMarkerStyles = {
  length: 80 / 3,
  lineWidth: 12,
  strokeStyle: '#111',
};

/**
 * Properties for the hour marker.
 */
const majorMarkerStyles = {
  length: 80,
  lineWidth: 24,
  strokeStyle: '#111',
};

const baseHandStyles = {
  strokeStyle: '#222',
  shadowColor: 'rgba(80, 0, 0, 0.25)',
  shadowBlur: 12,
  shadowOffset: new Vector(4)
};

/**
 * Properties for the hour hand.
 */
const hourHandStyles = Object.assign({}, baseHandStyles, {
  length: 300,
  offset: -40,
  lineWidth: 48
});

/**
 * Properties for the minute hand.
 */
const minuteHandStyles = Object.assign({}, baseHandStyles, {
  length: 390,
  offset: -60,
  lineWidth: 32,
});

/**
 * Properties for the second hand.
 */
const secondHandStyles = Object.assign({}, baseHandStyles, {
  length: 270,
  offset: -80,
  lineWidth: 12,
  fillStyle: '#c00',
  strokeStyle: '#c00',
  shadowColor: 'rgba(80, 0, 0, 0.25)'
});

/**
 * Properties for the timer circle.
 */
const timerStyles = {
  fillStyle: '#800'
};

// Event Bindings
//

// Handle Resize
window.addEventListener('resize', handleResize);
// Handle Pixel Ratio
window.matchMedia('screen and (min-resolution: 2dppx)').addEventListener('change', handleResize);

// Handle Clicks
let clickDebounceId;

// Double-Click > Go to Fullscreen
container.addEventListener('dblclick', (e) => {
  clearTimeout(clickDebounceId);
  toggleFullscreen();
});

// Single-Click > Start Timer
canvas.addEventListener('click', (e) => {
  clearTimeout(clickDebounceId);
  clickDebounceId = setTimeout(() => {
    handleClick(e);
  }, 200);
});


// Main
//
handleResize();
requestAnimationFrame(loop);

// Functions
//

// Event Handlers
//

function handleClick(e) {

  const target = getClickPosition(e);

  let timerHit = null;
  let outerRadius = clockRadius - clockPadding;

  for (let i = -14; i < 46; i++) {
    const x = Math.cos(Math.PI * 2 / 60 * i);
    const y = Math.sin(Math.PI * 2 / 60 * i);

    let markerStyles = i % 5 === 0 ? majorMarkerStyles : minorMarkerStyles;

    // Calculate the position of the hour marker.
    const marker = new Vector(x, y).multiply(outerRadius - markerStyles.length / 2);
    const markerZone = clockCenter.add(marker);

    if (target.distanceFrom(markerZone) < markerStyles.length / 2) {
      timerHit = i + 15;
      break;
    }
  }

  if (timerHit != null) {
    // Start the timer.
    timerElapsed = 0;
    timerLimit = timerHit * 60 * 1000;
    timerStarted = true;
  } else if (timerStarted && timerElapsed >= timerLimit) {
    // Reset timer.
    timerElapsed = 0;
    timerLimit = 0;
    timerStarted = false;
  }
}

/**
 * Event handler for window resize. Resizes the canvas element and sets the correct scale.
 */
function handleResize() {

  // Get the shortest side of the window rectangle.
  const targetSide = Math.min(window.innerWidth, window.innerHeight);
  const windowSize = new Vector(targetSide);

  // Get the pixel ratio to use for scaling.
  const devicePixelRatio = window.devicePixelRatio || 1;

  // Set the canvas size.
  canvas.width = windowSize.x * devicePixelRatio;
  canvas.height = windowSize.y * devicePixelRatio;

  // Set the canvas display size.
  canvas.style.width = windowSize.x + 'px';
  canvas.style.height = windowSize.y + 'px';

  // Calculate and set the scale.
  scale = windowSize.multiply(devicePixelRatio).divide(baseCanvasSize);
  ctx.scale(scale.x, scale.y);
}

// Utilities
//

/**
 * Gets a mouse position vector relative to the scaled canvas.
 * @param {MouseEvent} e The mouse event.
 */
 function getClickPosition(e) {
  const boundingClientRect = e.target.getBoundingClientRect();
  
  const offset = new Vector(boundingClientRect.left, boundingClientRect.top);
  const client = new Vector(e.clientX, e.clientY);

  return client.subtract(offset).divide(scale);
}

/**
 * Handle cross-browser requestFullscreen.
 * @param {HTMLElement} element The element to use as fullscreen.
 */
function requestFullscreen(element) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  }
}

/**
 * Handle cross-browser exitFullscreen.
 */
function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  }
}

/**
 * Handle cross-browser fullscreenElement.
 * @returns 
 */
function getFullscreenElement() {
  if (document.fullscreenElement) {
    return document.fullscreenElement;
  }

  return document.webkitFullscreenElement;
}

/**
 * Toggles the container as the fullscreen element.
 */
function toggleFullscreen() {

  if (getFullscreenElement()) {
    exitFullscreen();
  } else {
    requestFullscreen(container);
  }
}

// Animation Functions
//

let previousTime = 0;

/**
 * The animation loop.
 */
function loop(time) {

  const delta = time - previousTime;
  previousTime = time;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawClockFace(ctx, clockCenter, clockRadius);
  drawTimer(ctx, clockCenter, clockRadius, timerStyles, delta);
  drawMarkers(ctx, clockCenter, clockRadius - clockPadding);
  drawHands(ctx, clockCenter, clockRadius - clockPadding);

  requestAnimationFrame(loop);
}

// Clock Functions
//

/**
 * Draws a circle with a wedge gap to illustrate elapsed time since timer started.
 * @param {CanvasRenderingContext2D} ctx The drawing context.
 * @param {Vector} center The center position.
 * @param {number} radius The radius of the timer circle.
 * @param {any} styles The styles.
 * @param {number} delta The time elapsed since the last draw.
 * @returns 
 */
function drawTimer(ctx, center, radius, styles, delta) {

  const { fillStyle, strokeStyle, lineWidth } = styles;

  if (!timerStarted) {
    return;
  }

  // Calculate the end angle.
  const endAngle = timerStartAngle + timerWedgeSize;

  // Draw a filled circle with a wedge gap.
  ctx.beginPath();
  ctx.moveTo(center.x, center.y);
  ctx.arc(center.x, center.y, radius - 7.5, timerStartAngle, endAngle, false);
  ctx.closePath();

  if (typeof fillStyle !== 'undefined') {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }

  if (typeof strokeStyle !== 'undefined') {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  // Update elapsed time.
  timerElapsed += delta;

  // Don't let it exceed.
  if (timerElapsed > timerLimit) {
    timerElapsed = timerLimit;
  }

  // Update the wedge gap.
  timerWedgeSize = (timerElapsed / timerLimit) * Math.PI * 2;
}

/**
 * Draws the clock face.
 * @param {CanvasRenderingContext2D} ctx The drawing context.
 * @param {Vector} center The center position.
 * @param {number} radius The radius of the clock face.
 */
function drawClockFace(ctx, center, radius) {
  drawCircle(ctx, center, radius, { fillStyle: clockBackgroundColor });
}

/**
 * Draws the hour, minute and second hands.
 * @param {CanvasRenderingContext2D} ctx The drawing context.
 * @param {Vector} center 
 */
function drawHands(ctx, center) {

  const time = new Date();

  // Rotate the context 90 degrees counter clockwise to make 0 radian point north.
  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate(-90 * Math.PI / 180);
  ctx.translate(-center.x, -center.y);

  const hh = time.getHours();
  const mm = time.getMinutes();
  const ss = time.getSeconds();
  const ms = time.getMilliseconds();

  // Calculate the angles for each hand in radians.
  // Add millisecond percision to each hand for smooth movement.
  const hourHandAngle = Math.PI * 2 / 12 * (hh + (smoothMovement ? (mm / 60) + (ss / 60 / 60) + (ms / 1000 / 60 / 60) : 0));
  const minuteHandAngle = Math.PI * 2 / 60 * (mm + (smoothMovement ? (ss / 60) + (ms / 1000 / 60) : 0));
  const secondHandAngle = Math.PI * 2 / 60 * (ss + (smoothMovement ? (ms / 1000) : 0));

  // Start and End Vectors
  const hour = getHandVectors(center, hourHandAngle, hourHandStyles.offset, hourHandStyles.length);
  const minute = getHandVectors(center, minuteHandAngle, minuteHandStyles.offset, minuteHandStyles.length);
  const second = getHandVectors(center, secondHandAngle, secondHandStyles.offset, secondHandStyles.length);

  // Draw the Hour Hand
  setDropShadow(ctx, hourHandStyles);
  drawLine(ctx, hour[0], hour[1], hourHandStyles);

  // Draw the Minute Hand
  setDropShadow(ctx, minuteHandStyles);
  drawLine(ctx, minute[0], minute[1], minuteHandStyles);

  // Draw the Second Hand
  // The second hand is multiple elements and we have to prevent the shadow
  // from being drawn onto the different elements. We do this by drawing
  // two passes. First we draw all elements with the shadow, then we draw
  // the elements again without shadow.
  //
  setDropShadow(ctx, secondHandStyles);
  drawLine(ctx, second[0], second[1], secondHandStyles);
  drawCircle(ctx, second[1], 40, secondHandStyles);
  drawCircle(ctx, center, 10, secondHandStyles);

  setDropShadow(ctx, {});
  drawLine(ctx, second[0], second[1], secondHandStyles);
  drawCircle(ctx, second[1], 40, secondHandStyles);
  drawCircle(ctx, center, 10, secondHandStyles);

  // Restore the context rotation.
  ctx.restore();
}

/**
 * Returns start and end vectors for a clocks hand.
 * @param {Vector} center The center vector.
 * @param {number} angle The angle of the hand measured in radians.
 * @param {number} offset The center offset for the short end of the hand.
 * @param {number} length The length from the center for the hand.
 */
function getHandVectors(center, angle, offset, length) {

  const vector = new Vector(Math.cos(angle), Math.sin(angle));
  const start = center.add(vector.multiply(offset));
  const end = center.add(vector.multiply(length));

  return [start, end];
}

/**
 * Draws 60 markers, with different styles for the minute and hour marks.
 * @param {CanvasRenderingContext2D} ctx The drawing context.
 * @param {Vector} center The center position of the clock.
 * @param {number} radius The radius of the clock.
 */
function drawMarkers(ctx, center, radius) {

  const minuteMarks = 60;
  const hourMarker = 60 / 12;

  for (let i = 0; i < minuteMarks; i++) {
    const x = Math.cos(Math.PI * 2 / minuteMarks * i);
    const y = Math.sin(Math.PI * 2 / minuteMarks * i);
    const end = new Vector(x, y);

    // Every 5 minute marker is an hour mark, others are minute marks.
    const markerStyles = i % hourMarker === 0 ? majorMarkerStyles : minorMarkerStyles;

    drawMarker(ctx, center, end, radius, markerStyles);
  }
}

/**
 * Draws a marker on the clock.
 * @param {CanvasRenderingContext2D} ctx The drawing context.
 * @param {Vector} center The center position of the clock.
 * @param {Vector} position The position of the marker.
 * @param {number} radius The radius from where the marker will start.
 * @param {any} styles The styles of the marker.
 */
function drawMarker(ctx, center, position, radius, styles) {

  const { length } = styles;

  // Draw the marker starting from the length of the radius and then
  // moving towards the center by the provided length.

  const start = center.add(position.multiply(radius));
  const end = center.add(position.multiply(radius - length));

  drawLine(ctx, start, end, styles);
}

// Canvas Functions
//

/**
 * Draws a line using stroke on the canvas.
 * @param {CanvasRenderingContext2D} ctx The drawing context.
 * @param {Vector} start The start position.
 * @param {Vector} end The end position.
 * @param {any} styles The styles of the line.
 */
function drawLine(ctx, start, end, styles) {

  const { lineWidth, strokeStyle } = styles;

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);

  ctx.lineWidth = lineWidth ?? 1;
  ctx.strokeStyle = strokeStyle ?? 'black';
  ctx.stroke();
}

/**
 * Draws a circle on the canvas.
 * @param {CanvasRenderingContext2D} ctx The drawing context.
 * @param {Vector} center The center position.
 * @param {number} radius The radius.
 * @param {any} styles The styles of the circle.
 */
function drawCircle(ctx, center, radius, styles) {

  const { fillStyle, lineWidth, strokeStyle } = styles;

  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI, false);

  if (typeof fillStyle !== 'undefined') {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }

  if (typeof lineWidth !== 'undefined') {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
  }
}

/**
 * Sets the drop shadow styles on the context.
 * @param {CanvasRenderingContext2D} ctx The drawing context.
 * @param {any} styles The styles of the shadow.
 */
function setDropShadow(ctx, styles) {
  
  const { shadowColor, shadowBlur, shadowOffset } = styles;

  ctx.shadowColor = shadowColor ?? 'rgba(0, 0, 0, 0)';
  ctx.shadowBlur = shadowBlur ?? 0;
  ctx.shadowOffsetX = shadowOffset?.x ?? 0;
  ctx.shadowOffsetY = shadowOffset?.y ?? 0;
}