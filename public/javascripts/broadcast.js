var ws;

$(document).ready(function() {
  
  roomId = $("#room").data('room');
  
  host = window.document.location.host.replace(/:.*/, '');
  ws = new WebSocket('ws://' + host + ':' + window.location.port);
  ws.onopen = function() {
    msg = {
      event: 'broadcast',
      room: roomId
    }
    ws.send(JSON.stringify(msg));
  }
  ws.onclose = function() {

  }
  ws.onmessage = function(event, flags) {
    msg = JSON.parse(event.data);
    if ('event' in msg) {
      if (msg.event == 'broadcast.error') {
        alert("Cannot use room " + roomId + ". " + msg.reason);
      }
      if (msg.event == 'broadcast.success') {
        setupAudio();
      }
    }
  }
  
});

function setupAudio() {
  navigator.getUserMedia = (navigator.getUserMedia ||
                            navigator.webkitGetUserMedia ||
                            navigator.mozGetUserMedia ||
                            navigator.msGetUserMedia);
  
  navigator.getUserMedia({audio:true, video:false}, function(stream) {
    
    context = new webkitAudioContext();
    
    node = context.createScriptProcessor(16384, 2, 2);
    node.connect(context.destination);
    
    mediaSS = context.createMediaStreamSource(stream);
    mediaSS.connect(node);
      
        
    node.onaudioprocess = onGotAudio;
    
  }, function(err) {
    
  });
}

function onGotAudio(event) {
  left  = event.inputBuffer.getChannelData(0);
  right = event.inputBuffer.getChannelData(1);
  mixed = concat(left, right);
  
  
  //compressed = Zee.compress(Array.prototype.slice.call(new Uint8Array(mixed.buffer)));
  opts = {
    compressionType: Zlib.Deflate.CompressionType.DYNAMIC
  }
  compressed = new Zlib.Deflate(new Uint8Array(mixed.buffer), opts).compress();
  console.log(avg(mixed));
  
  //console.log(mixed.length + ":" + compressed.length);
  //console.log(avg(compressed));
  ws.send(compressed);
  //ws.send(mixed);
}

function concat(a, b) {
  var l = a.length;
  var r = new Float32Array(a.length + b.length);
  r.set(a);
  r.set(b, l);
  return r;
}

function avg(a) {
  sum = 0;
  for (var i = 0; i < a.length; i++)
    sum += a[i];
  return sum / a.length;
}

