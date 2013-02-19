module.exports = function(app) {
  var rooms = app.controllers.rooms;
  app.get('/broadcast/:room', rooms.broadcast);
  app.get('/speaker/:room', rooms.speaker);
}