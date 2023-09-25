
const world000 = document.getElementById('world000');
const ctxBG = world000.getContext('2d');

// Set canvas size
world000.width = 2800;
world000.height = 2000;

for (let x = 0; x < world000.width * 10; x += 60) {    
  ctxBG.beginPath();
  ctxBG.moveTo(x , 0);
  ctxBG.lineTo(x , world000.height);
  ctxBG.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctxBG.lineWidth = 2;
  ctxBG.stroke();
}

for (let y = 0; y < world000.height * 10; y += 60) {
  ctxBG.beginPath();
  ctxBG.moveTo(0, y);
  ctxBG.lineTo(world000.width * 2, y);
  ctxBG.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctxBG.lineWidth = 2;
  ctxBG.stroke();
}

