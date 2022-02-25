import {Analyser} from "tone";

// Global data
let analysers = null;
let contexts = null;
let canvasWidth = 0, canvasHeight = 0;

// HORizontal and VERTical lines
const VERT = 4, HOR = 6;

// Blue, Red, Yellow, Black
let colors = {0: "#569dcb", 1: "#f9b131", 2: "#FF2326", 3: "#FFFFFF"};

// Draw black background
export function onLoad(){

  for (let i = 0; i < 4; i++){
    const canvas = document.querySelector('#wave' + i); // has style information
    const context = canvas.getContext('2d'); // has drawing context
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    context.fillStyle = 'rgba(0,0,0,1.0)';
    context.fillRect(0,0,canvasWidth,canvasHeight);
    drawGrid(context);
  }

}

// takes in drawing context
function drawGrid(context){

    // set line stroke and line width
    context.strokeStyle = 'green';
    context.lineWidth = 1.0;

    for (let i = 0; i < HOR; i++){
      // draw a red line
      context.beginPath();
      context.moveTo(i * canvasWidth / HOR, 0);
      context.lineTo(i * canvasWidth / HOR, canvasHeight);
      context.stroke();
    }

    for (let i = 0; i < VERT; i++){
      // draw a red line
      context.beginPath();
      context.moveTo(0, i * canvasHeight / VERT);
      context.lineTo(canvasWidth, i * canvasHeight / VERT);
      context.stroke();
    }
}

// Create analysers for each instrument then connect them
export function getAnalysers(instruments) {
    const allAnalysers = {};
    for (let instrument = 0; instrument < Object.keys(instruments).length; instrument ++) {
        allAnalysers[instrument] = new Analyser("waveform", 1024);
        instruments[instrument].fan(allAnalysers[instrument]);
    }

    analysers = allAnalysers;
}


// Create a context object for each insturment
export function allContext(instruments) {
  const allContexts = {};

  for (let instrument = 0; instrument < Object.keys(instruments).length; instrument ++) {
    try {
      allContexts[instrument] = document.querySelector('#wave' + instrument);
    }
    catch (DOMException) {}
  }
  contexts = allContexts;
}


// Create soundwave of each instrument
export function createWave(canv, values, color) {

    // clear the image
    const context = canv.getContext('2d');
    context.clearRect(0, 0, canvasWidth, canvasHeight);

    // draw background
    context.fillStyle = 'rgba(0,0,0,1.0)';
    context.fillRect(0,0,canvasWidth,canvasHeight);

    // draw grid
    drawGrid(context);

    // initialize line path
    context.beginPath();
    context.lineJoin = "round";
    context.lineWidth = 3;
    context.moveTo(0, canvasHeight - (values[0] / 255) * canvasHeight);

    // ADD THIS TO GIVE EACH CHANNEL ITS OWN COLOR
    // context.strokeStyle = colors[color % 4];

    // connect lines
    for (let i = 1, len = values.length; i < len; i++){
      let val = values[i];
      let x = canvasWidth * (i / len);
      let y = canvasHeight - (val * canvasHeight);
      context.lineTo(x, y);
    }

    //draw line
    context.stroke();
  }


// Draw them all to canvas
export function drawWave() {
    requestAnimationFrame(drawWave);
    
    for (let i = 0; i < Object.keys(analysers).length; i ++) {
      createWave(contexts[i], analysers[i].getValue(), i);
    }
}
