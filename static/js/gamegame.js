const world = document.getElementById("world");
const world001 = document.getElementById("world001");
const ctx = world001.getContext("2d");

world001.width = "2800";
world001.height = "2000";

let width = world001.width;
let height = world001.height;

var socket = io('http://localhost:3351');

const form = document.getElementById('form');
const input = document.getElementById('messageInput');

const messageInput = document.getElementById('messageInput');
const messageBtn = document.getElementById('messageBtn');
const barbarM = document.getElementById('barbarM');
const barbarM2 = document.getElementById('barbarM2');

var initGame = false;
var isVVchanged = false;

const colorCodeT = [
  ["rgba(255, 255, 255, 0.85)", "rgba(200, 200, 200, 0.7)", "rgba(80, 80, 80, 0.5)"],
  ["rgba(255, 200, 200, 0.85)", "rgba(200, 150, 150, 0.7)", "rgba(150, 50, 50, 0.5)"],
  ["rgba(200, 200, 255, 0.85)", "rgba(150, 150, 200, 0.7)", "rgba(70, 70, 170, 0.5)"],
  ["rgba(200, 255, 200, 0.85)", "rgba(150, 200, 150, 0.7)", "rgba(70, 170, 70, 0.5)"],
  ["rgba(180, 235, 255, 0.85)", "rgba(140, 190, 205, 0.7)", "rgba(40, 125, 140, 0.5)"],
  ["rgba(235, 255, 180, 0.85)", "rgba(190, 205, 140, 0.7)", "rgba(125, 140, 40, 0.5)"],
  ["rgba(255, 235, 180, 0.85)", "rgba(205, 190, 140, 0.7)", "rgba(140, 125, 40, 0.5)"],
  ["rgba(235, 155, 235, 0.85)", "rgba(200, 130, 200, 0.75)", "rgba(130, 80, 130, 0.5)"],
  ["rgba(205, 245, 245, 0.85)", "rgba(130, 190, 210, 0.75)", "rgba(40, 135, 145, 0.5)"],
  ["rgba(255, 70, 235, 0.85)", "rgba(200, 100, 180, 0.75)", "rgba(140, 40, 165, 0.5)"],
  ["rgba(235, 255, 70, 1)", "rgba(180, 200, 100, 0.75)", "rgba(140, 165, 45, 0.5)"],
  ["rgba(255, 235, 70, 1)", "rgba(200, 180, 100, 0.75)", "rgba(165, 140, 40, 0.5)"],
  ["rgba(215, 255, 170, 1)", "rgba(180, 220, 150, 0.75)", "rgba(120, 135, 85, 0.5)"],
  ["rgba(225, 255, 225, 1)", "rgba(175, 175, 175, 0.75)", "rgba(120, 120, 120, 0.5)"],
  ["rgba(234, 123, 188, 1)", "rgba(210, 100, 150, 0.75)", "rgba(160, 100, 125, 0.5)"]
]

//constructor function for building the new ball
class ballCreator {
  constructor(context, x, y, r, mass = 1, cor = 1, vx = 0, vy = 0, colorCodeWIndex, socketId, name) {
    this.context = context;
    this.x = x;
    this.y = y;
    this.r = r;
    this.mass = mass;
    this.cor = cor;
    this.vx = vx;
    this.vy = vy;
    this.ifColliding = false;
    this.accle = 0;
    this.color = colorCodeWIndex;
    this.color2 = this.color[2];
    this.color1 = this.color[1];
    this.color0 = this.color[0];
    this.id = socketId;
    this.name = name;
  }
}

//build the moving path calculation
class vectorGenerator {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(v){
    return new vectorGenerator(this.x + v.x, this.y + v.y);
  }
  minus(v){
    return new vectorGenerator(this.x - v.x, this.y - v.y);
  }
  multiply(factor){
    return new vectorGenerator(this.x * factor, this.y * factor);
  } 
  //a^2 + b^2 = c^2
  cLength(){ 
    let c = Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    return new vectorGenerator(this.x / c, this.y / c);
  }
  //calculating the length of the vector projection
  proj(v){
    return this.x * v.x + this.y * v.y;
  }
}
// declare a local playerlist
let balls = []; 

// comparing the distance and the sum of two different radius
// if distanceBetweenBalls less or equal to totalLengthOfTwoRadius that mean collision is happening
function distanceShorterThanSumOfRadius (ballA, anotherBall) {
  let distanceBetweenBalls = Math.pow((ballA.x - anotherBall.x), 2) + Math.pow((ballA.y - anotherBall.y), 2);
  let totalLengthOfTwoRadius = Math.pow((ballA.r + anotherBall.r),2);
  return distanceBetweenBalls <= totalLengthOfTwoRadius;
}

//checking if there is collision with someone else
//if yes, than the velocity and vector need to be modified
function modifyVelocityDueToCollision (ballA, anotherBall) {
  if (distanceShorterThanSumOfRadius(ballA, anotherBall)) {
    ballA.ifColliding  = true;
    anotherBall.ifColliding  = true;
    modifyVelocity(ballA, anotherBall);
    isVVchanged = true;
  }
}

function modifyVelocity(ballA, anotherBall) {

  let velocityCurr = new vectorGenerator(ballA.vx, ballA.vy);
  let velocityAnother = new vectorGenerator(anotherBall.vx, anotherBall.vy);

  let valocityOfLineOfCenter = new vectorGenerator(ballA.x - anotherBall.x, ballA.y - anotherBall.y);

  let vectorLoc = valocityOfLineOfCenter.cLength(); 
  let vectorTan = new vectorGenerator (-vectorLoc.y, vectorLoc.x);

  let v1Loc = velocityCurr.proj(vectorLoc);
  let v1Tan = velocityCurr.proj(vectorTan);

  let v2Loc = velocityAnother.proj(vectorLoc);
  let v2Tan = velocityAnother.proj(vectorTan); 

  let cor = Math.min(ballA.cor, anotherBall.cor);

  let v1LocAfter =
    (ballA.mass * v1Loc + anotherBall.mass * v2Loc + cor * anotherBall.mass * (v2Loc - v1Loc)) /
    (ballA.mass + anotherBall.mass);

  let v2LocAfter =
    (ballA.mass * v1Loc + anotherBall.mass * v2Loc + cor * ballA.mass * (v1Loc - v2Loc)) /
    (ballA.mass + anotherBall.mass);

  if (v1LocAfter < v2LocAfter) {
    return;
  }

  let v1VectorLoc = vectorLoc.multiply(v1LocAfter);
  let v1VectorTan = vectorTan.multiply(v1Tan);

  let v2VectorLoc = vectorLoc.multiply(v2LocAfter);
  let v2VectorTan = vectorTan.multiply(v2Tan);

  let velocity1After = v1VectorLoc.add(v1VectorTan);
  let velocity2After = v2VectorLoc.add(v2VectorTan);

  ballA.vx = velocity1After.x;
  ballA.vy = velocity1After.y;

}

checkCollision = () => {
  balls.forEach((uniball) => (uniball.ifColliding = false));

  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      balls[i].modifyVelocityDueToCollision(balls[j]);
    }
  }
}

checkEdgeCollision = (uniball) => {
  const cor = 0.8;
    if (uniball.x < uniball.r) {
      uniball.vx = -uniball.vx * cor;
      uniball.x = uniball.r;
      isVVchanged = true;
    } else if (uniball.x > width - uniball.r) {
      uniball.vx = -uniball.vx * cor;
      uniball.x = width - uniball.r;
      isVVchanged = true;
    }

    if (uniball.y < uniball.r) {
      uniball.vy = -uniball.vy * cor;
      uniball.y = uniball.r;
      isVVchanged = true;
    } else if (uniball.y > height - uniball.r) {
      uniball.vy = -uniball.vy * cor;
      uniball.y = height - uniball.r;
      isVVchanged = true;
    }
}

function selfUpdate(subject, s) {
  subject.x += subject.vx * s;
  subject.y += subject.vy * s;
  isVVchanged = true;
    if(newPlayer !== undefined){
      window.scrollTo(newPlayer.x - (window.innerWidth / 2), newPlayer.y - (window.innerHeight / 2));
    }
}

function draw(){
  isVVchanged = false;
  if(newPlayer !== undefined){
    checkEdgeCollision(newPlayer);
    for (let i = 0; i < balls.length; i++) {
      if(balls[i].id === newPlayer.id){
        continue;
      }
      modifyVelocityDueToCollision(newPlayer, balls[i]);
    }
  }

  ctx.clearRect(0, 0, width, height);
  // draw other players except 'myself'
  for (let i = 0; i < balls.length; i++) {
    if(balls[i].id !== newPlayer.id){
      let colorRound = ctx.createRadialGradient(balls[i].x, balls[i].y, balls[i].r, balls[i].x, balls[i].y, balls[i].r/2.2);
      colorRound.addColorStop(0, balls[i].color2);
      colorRound.addColorStop(0.5, balls[i].color1);
      colorRound.addColorStop(1, balls[i].color0);
      ctx.fillStyle = colorRound;
      ctx.beginPath();
      ctx.arc(balls[i].x, balls[i].y, balls[i].r, 0, 2 * Math.PI);
      ctx.fill();
      ctx.font = '18px Caveat';
      ctx.fillStyle = 'rgb(120, 185, 255)';
      ctx.fillText(balls[i].name, balls[i].x - (balls[i].r/(8/balls[i].name.length)), balls[i].y - balls[i].r);
    }
  }
  // draw player "myself"
  if(newPlayer !== undefined){
    let colorRound = ctx.createRadialGradient(newPlayer.x, newPlayer.y, newPlayer.r, newPlayer.x, newPlayer.y, newPlayer.r/2.2);
    colorRound.addColorStop(0, newPlayer.color2);
    colorRound.addColorStop(0.5, newPlayer.color1);
    colorRound.addColorStop(1, newPlayer.color0);
    ctx.fillStyle = colorRound;
    ctx.beginPath();
    ctx.arc(newPlayer.x, newPlayer.y, newPlayer.r, 0, 2 * Math.PI);
    ctx.fill();
    ctx.font = '18px Caveat';
    ctx.fillStyle = 'rgb(150, 255, 255)';
    ctx.fillText(newPlayer.name, newPlayer.x - (newPlayer.r/newplayerNameDevidedByX), newPlayer.y - newPlayer.r);
    selfUpdate(newPlayer, 0.0167);
  }

  if(isVVchanged === true){
    socket.emit('playerIsMoving', newPlayer);
    isVVchanged = false;
  }
}
// FPS updating rate on the client side, every one second (1000ms) update 60 times 
var renderInterval = setInterval(draw, 1000/60);

//after page loading successfully
function velocityChange (subject, newCoordinate){
  const supprotToBeDelta = 400; //the speed of ball
  let deltaX = newCoordinate[0] - subject.x;
  let deltaY = newCoordinate[1] - subject.y;
  if(Math.abs(deltaX) > Math.abs(deltaY)){
    let currRatio = deltaX/deltaY;
    deltaX = Math.sign(deltaX) * supprotToBeDelta;
    deltaY = deltaX/currRatio;
  }
  else if(Math.abs(deltaX) <= Math.abs(deltaY)){
    let currRatio = deltaY/deltaX;
    deltaY = Math.sign(deltaY) * supprotToBeDelta;
    deltaX = deltaY/currRatio;
  }

  if(subject.accle === 0){
    let aVX = deltaX/6;
    let aVY = deltaY/6;
    subject.vx = Math.sign(deltaX) * subject.vx;
    subject.vy = Math.sign(deltaY) * subject.vy;
    subject.accle = 1;
    setTimeout(()=>{
      subject.vx += aVX;
      subject.vy += aVY;
    },200);
    setTimeout(()=>{
      subject.vx += aVX;
      subject.vy += aVY;
    },400);
    setTimeout(()=>{
      subject.vx += aVX;
      subject.vy += aVY;
    },600);
    setTimeout(()=>{
      subject.vx += aVX;
      subject.vy += aVY;
    },800);
    setTimeout(()=>{
      subject.vx += aVX;
      subject.vy += aVY;
    },1000);
    setTimeout(()=>{
      subject.vx = deltaX;
      subject.vy = deltaY;
    },1200);
  }
  else if(subject.accle === 1){
    subject.vx = deltaX;
    subject.vy = deltaY;
  }
}

function velocityChange2 (subject){
  aVX = subject.vx * 0.2;
  aVY = subject.vy * 0.2;
  setTimeout(()=>{
    subject.vx -= aVX;
    subject.vy -= aVY;
  },250);
  setTimeout(()=>{
    subject.vx -= aVX;
    subject.vy -= aVY;
  },500);
  setTimeout(()=>{
    subject.vx -= aVX;
    subject.vy -= aVY;
  },750);
  setTimeout(()=>{
    subject.vx -= aVX;
    subject.vy -= aVY;
  },1000);
  setTimeout(()=>{
    subject.vx = 0;
    subject.vy = 0;
    subject.accle = 0;
  },1200);
}

var newPlayer;
var newPlayerName;
var newplayerNameDevidedByX;


socket.on('playerInit', (playerName) => {
  newPlayerName = playerName;
  newplayerNameDevidedByX = 8/playerName.length;
  socket.emit('aaaa', playerName);
});
socket.on('playerInit2', (foundPlayer) => {
  newPlayerName = foundPlayer.name;
  newplayerNameDevidedByX = 8/foundPlayer.name.length;
  foundPlayer.character.id = socket.id
  socket.emit('aaaa2', newPlayerName, foundPlayer);
});
socket.on('gameBallsInit', (playersList2) => {  
  balls = playersList2;
});

socket.on('playersList', (playersList) => {
  // Verify user's id (as known as socket.id) to check if it is in the database
  // If yes, then generate a ball
  if(playersList.some(el => el.id === socket.id)){
    newPlayer = new ballCreator(ctx, 400, 400, 30, 50, 0.5, 0, 0, colorCodeT[Math.floor(Math.random() * 15)], socket.id, newPlayerName);
    socket.emit('newPlayerCreateReturn', newPlayer);   
  }
});
socket.on('playersListEx', (foundPlayer) => {
  // Verify existed user's id (as known as socket.id) to check if it is in the database
  // If yes, then generate a ball on the frontend base on the last time last miunte location 
  if(foundPlayer.character.id === socket.id){
  newPlayer = new ballCreator(ctx, foundPlayer.character.x, foundPlayer.character.y, foundPlayer.character.r, foundPlayer.character.mass, foundPlayer.character.cor, 0, 0, foundPlayer.character.color, socket.id, foundPlayer.character.name);
  socket.emit('newPlayerCreateReturn2', newPlayer);
  }
});


socket.on('playersDataUpdate', (playersList2) =>{
    balls = playersList2;
});


// Chat room functionality
form.addEventListener('submit', function(e) {
  e.preventDefault();
  if (input.value) {
      let msgStyle = [];
      socket.emit('chat message', messageInput.value, newPlayer.name, msgStyle);
      messageInput.value = '';
  }
});

socket.on('chat message', function(msg, talker, msgstyle) {
  let item = document.createElement('li');
  item.textContent = talker + ': ' + msg;
  messageBoard.appendChild(item);
  if (messageBoard.childElementCount > 100) {
      messageBoard.firstChild.remove();
  }
  messageBoard.scrollTo(0, messageBoard.scrollHeight);
});

world.addEventListener('contextmenu',(event) => {
  if (event.target === messageInput || messageInput.contains(event.target) || event.target === messageBtn || messageBtn.contains(event.target)) {
    return; 
  }
    event.preventDefault();    
    velocityChange2(newPlayer);
})

world.addEventListener('click',(event) => {
  if (event.target === messageInput || messageInput.contains(event.target) || event.target === messageBtn || messageBtn.contains(event.target)) {
    return;
  }
    let arrayDestination = [event.pageX, event.pageY];
    velocityChange(newPlayer, arrayDestination);
})


