var WebSocketServer = require('ws').Server;
var Hashtable;
var rooms = {};
var roomNameCache;

module.exports = function(app, server) {
  Hashtable = app.lib.hashtable.Hashtable;
  roomNameCache = new Hashtable();
  
  var wss = new WebSocketServer({server: server});
  wss.on('connection', function(ws) {
    ws.on('message', function(e, flags) {
      handleMessage(ws, e, flags);
    });
    ws.on('close', function() {
      handleUnsubscribe(ws);
    });
  });
}

function handleMessage(ws, e, flags) {
  if (flags.binary) {
    handleBroadcast(ws, e);
  } else {
    msg = JSON.parse(e);
    if ('event' in msg) {
      if (msg.event == 'broadcast')
        handleBroadcastSubscribe(ws, msg);
      if (msg.event == 'speaker')
        handleSpeakerSubscribe(ws, msg);
      if (msg.event == 'clock.sync') {
        handleClockSync(ws, msg);
      }
    } else {
      console.log("bad event: " + e);
    }
  }
}

function handleClockSync(ws, msg) {
  msg.data.t1 = new Date().getTime();
  msg.data.t2 = new Date().getTime();
  ws.send(JSON.stringify(msg));
}

function handleBroadcast(ws, buffer) {
  roomName = roomNameCache.get(ws);
  if (typeof roomName != 'undefined') {
    room = rooms[roomName];
    nb = new Buffer(buffer.length + 16);
    d = Date.now();
    nb.writeDoubleLE(d, 0);
    buffer.copy(nb, 16);
    //console.log(d + ":" + nb.readFloatLE(8));
    for(var i = 0; i < rooms[roomName].clients.length; i++) {
      if (typeof rooms[roomName].clients[i] != 'undefined') {
        nb.writeDoubleLE(Date.now(), 8);
        console.log(nb.readUInt8(24));
        rooms[roomName].clients[i].send(nb, {binary: true});
      }
    }
  }
}


function handleBroadcastSubscribe(ws, msg) {
  if (!(msg.room in rooms)) {
    // encoder.on('data', function(data) {
    //   for(var i = 0; i < rooms[msg.room].clients.length; i++) {
    //     if (typeof rooms[msg.room].clients[i] != 'undefined') {
    //       rooms[msg.room].clients[i].send(data, {binary: true});
    //     }
    //   }
    // });
    rooms[msg.room] = {
      broadcaster: ws,
      clients: []
    }
    roomNameCache.put(ws, msg.room);
    ws.send(JSON.stringify({
      event:'broadcast.success'
    }));
  } else {
    ws.send(JSON.stringify({
      event:'broadcast.error',
      reason:'A broadcaster already exists in this room'}));
  }
}

function handleSpeakerSubscribe(ws, msg) {
  if (msg.room in rooms) {
    rooms[msg.room].clients.push(ws);
    roomNameCache.put(ws, msg.room);
    ws.send(JSON.stringify({
      event: 'speaker.success'
    }));
  } else {
    ws.send(JSON.stringify({
      event:'speaker.error',
      reason:'There is no broadcaster in this room'}));
  }
}

function handleUnsubscribe(ws) {
  room = roomNameCache.get(ws);
  if (typeof room != 'undefined') {
    if (typeof rooms[room] != 'undefined'  && rooms[room].broadcaster == ws) {
      delete rooms[room];
    } else {
      if (room in rooms) {
        for(var i = 0; i < rooms[room].clients.length; i++) {
          if (rooms[room].clients[i] == ws) {
            delete rooms[room].clients[i];
          }
        }
      }
    }
    roomNameCache.remove(ws);
  }
}