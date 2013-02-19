exports.broadcast = function(req, res, next) {
  
  res.render('broadcast', { room: req.params.room, title: 'Broadcast' });
}

exports.speaker = function(req, res, next) {
  
  res.render('speaker', { room: req.params.room, title: 'Speaker' });
}
