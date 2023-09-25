const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require('socket.io')(server);
const path = require('path');
const mongoose = require('mongoose');
const { disconnect } = require("process");

app.use(express.json());

mongoose.connect('your Mongo DB address');

const db = mongoose.connection;
//Bind connection to error event (to get notification of connection errors)
// If database connected failed
db.on('error', (err) => {
  console.error(err);
});
// If database connected successfully
db.once('open', (db) => {
  console.log('Connected to MongoDB');
}); 
// Define a database schema for users' data storage
const playersDBSchema = new mongoose.Schema({
  name: String,
  acc: String,
  pw: String,
  character: Object
});

const playersData = mongoose.model('playersData', playersDBSchema);

//Declaring a list of players
var playersList = [];
//Declaring a list of players for real-time handling
const playersList2 = [];

const playerCache = {};
const connectPlayerCache = {}


app.use('/public', express.static(path.join(__dirname,'./static')));

app.get('/',(req, res)=>{
   res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/storeInput', (req, res) => {
  let playerName = req.body.name;
  let playerAcc = req.body.acc;
  let playerPw = req.body.pw;
  if (playerName && playerAcc && playerPw) {
    playerCache.name = playerName;
    playerCache.acc = playerAcc;
    playerCache.pw = playerPw;
    io.emit('playerInit', playerName);

  } else { 
    // Send a bad request response
    return res.sendStatus(400);
  }
});

app.post('/storeInputEx', (req, res) => {
  let playerAcc = req.body.acc2;
  let playerPw = req.body.pw2;
  if (playerAcc && playerPw) {
    playersData.findOne({ acc: playerAcc, pw: playerPw })
      .then((foundPlayer) => {
        if(foundPlayer){
          io.emit('playerInit2', foundPlayer);
          return res.sendStatus(200);
        }
        else {
          return res.sendStatus(401);
        }
      })
      .catch((err) => {
        console.error('Error querying the database:', err);
        return res.sendStatus(500);
      })
  } else {
    // Send a bad request response
    return res.sendStatus(400); 
  }
});

//////////////////////////////////////////////////////////////////////

io.on('connection', (socket) => {
  console.log('a user connected');
});

// WebSocket event listener
io.on('connection', function (socket) {

    socket.on('aaaa', (playerName) => {

      if(playersList.some(el => el.id === socket.id) === false){
      let newPlayer = {'type': 0, 'id': socket.id, 'name': playerName};
      playersList.push(newPlayer);

      console.log('新玩家加入', playersList);
      socket.emit('gameBallsInit', playersList2);
      socket.emit('playersList', playersList)

      }
    })
    socket.on('aaaa2', (playerName, foundPlayer) => {

      if(playersList.some(el => el.id === socket.id) === false){
      let newPlayer = {'type': 0, 'id': socket.id, 'name': playerName};
      playersList.push(newPlayer);
      connectPlayerCache[socket.id] = foundPlayer;
      console.log('新玩家加入', playersList);
      socket.emit('gameBallsInit', playersList2);
      socket.emit('playersListEx', foundPlayer)
      console.log("foundPlayerfoundPlayer", foundPlayer);

      }
    })  
    // Updated the players' list after user created their own "player"
    socket.on('newPlayerCreateReturn', (newPlayer) => {
      playersList2.push(newPlayer);
      isPlayersInfoChanged = true;
      //last object saved into the cache
      playerCache.character = newPlayer;
      connectPlayerCache[socket.id] = newPlayer;
      //save it to the database
      let newPlayerData = new playersData(playerCache);
      newPlayerData.save()
        .then(()=>{
          console.log('new player ' + newPlayer.name + 'saved into database successfully!');
        })
        .catch(()=>{
          console.log('new player saved into database failed...');
        })
    })
    // re-draw the player for the existed players, and updated the players list
    socket.on('newPlayerCreateReturn2', (newPlayer) => {
      playersList2.push(newPlayer);
      isPlayersInfoChanged = true;
    })


    socket.on('playerIsMoving', (mover) => {
      let updatePlayer = playersList2.find(el => el.id === mover.id);
      if(updatePlayer){
        updatePlayer.x = mover.x;
        updatePlayer.y = mover.y;
        updatePlayer.vx = mover.vx;
        updatePlayer.vy = mover.vy;
        isPlayersInfoChanged = true;
      }
    }) 

       
    // An event listener to detect the user's disconnection, and remove the player from the 'online' list
    socket.on('disconnect', function () {
        console.log('user disconnected');
        // remove this player from playersList
        let indexRemove;
        let tempCache;
        playersList2.forEach(el => {
          if (el.id === socket.id){
            indexRemove = playersList2.indexOf(el);
            tempCache = el;
          }
        })
        playersList2.splice(indexRemove, 1);
        playersList.splice(indexRemove, 1);
        isPlayersInfoChanged = true;
        if(connectPlayerCache[socket.id]){
          playersData.findOneAndUpdate({acc: connectPlayerCache[socket.id].acc, pw: connectPlayerCache[socket.id].pw}, {character: tempCache})
            .then(()=>{
              console.log(tempCache.name + "has been disconnected");
            })
            .catch(()=>{
              console.log(tempCache.name + "has been disconnected and we lost him... QAQ...");
            })
        }
    });
    
});

let isPlayersInfoChanged = false;

// FPS updating rate on the server side, every one second (1000ms) update 60 times 
let serverUpdate = setInterval(mainUpdate, 1000/60);

function mainUpdate(){
  if(isPlayersInfoChanged === true){ 
      io.emit('playersDataUpdate', playersList2);
      isPlayersInfoChanged = false;
  }
}

io.on('connection', (socket) => {
  socket.on('chat message', (msg2, talker, msgStyle) => {
    io.emit('chat message', msg2, talker, msgStyle);
  });
});

server.listen(3351, () => {
  console.log("Starting at", 3351);
});
