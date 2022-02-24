import {Analyser} from "tone";

let analysers = null;
let contexts = null;
// Blue, Red, Yellow, Black
let colors = {0: "#569dcb", 1: "#f9b131", 2: "#FF2326", 3: "#FFFFFF"};

export function onLoad(){

  for (let i = 0; i < 4; i++){
    const canv = document.querySelector('#wave' + i);
    const cont = canv.getContext('2d');
    const canvasWidth = canv.width, canvasHeight = canv.height;
    cont.fillStyle = 'rgba(0,0,0,1.0)';
    cont.fillRect(0,0,canvasWidth,canvasHeight);
    drawGrid(canv,cont);
  }

}

function drawGrid(canv,ctx){

    const vert = 4, hor = 6;
    const canvasWidth = canv.width, canvasHeight = canv.height;

    // set line stroke and line width
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 1;

    for (let i = 0; i < hor; i++){
      // draw a red line
      ctx.beginPath();
      ctx.moveTo(i * canvasWidth / hor, 0);
      ctx.lineTo(i * canvasWidth / hor, canvasHeight);
      ctx.stroke();
    }

    for (let i = 0; i < vert; i++){
      // draw a red line
      ctx.beginPath();
      ctx.moveTo(0, i * canvasHeight / vert);
      ctx.lineTo(canvasWidth, i * canvasHeight / vert);
      ctx.stroke();
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
    const canvasWidth = canv.width, canvasHeight = canv.height;
    let context = canv.getContext('2d');

    context.clearRect(0, 0, canvasWidth, canvasHeight);
    context.fillStyle = 'rgba(0,0,0,1.0)';
    context.fillRect(0,0,canvasWidth,canvasHeight);
    drawGrid(canv,context);
    context.beginPath();
  
    context.lineJoin = "round";
    context.lineWidth = 2;
    
  
    context.moveTo(0, canvasHeight - (values[0] / 255) * canvasHeight);

    // ADD THIS TO GIVE EACH CHANNEL ITS OWN COLOR
    // context.strokeStyle = colors[color % 4];

    for (let i = 1, len = values.length; i < len; i++){
      let val = values[i];
      let x = canvasWidth * (i / len);
      let y = canvasHeight - (val * canvasHeight);
      context.lineTo(x, y);
    }
    context.stroke();
  }


// Draw them all to canvas
export function drawWave() {
    requestAnimationFrame(drawWave);
    
    for (let i = 0; i < Object.keys(analysers).length; i ++) {
      createWave(contexts[i], analysers[i].getValue(), i);
    }
}
