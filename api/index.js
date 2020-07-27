const express = require('express');

if (process.env.NODE_ENV !== 'production') require('dotenv').config();
require('./utils/db').connect();

const app = express();

app.use(require('helmet')());
app.use(require('cors')());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const server = require('http').createServer(app);
const io = require('socket.io')(server).sockets;

const chatControllers = require('./controllers/chat');
const whatsNewController = require('./controllers/whatsNew');
const fileController = require('./controllers/file');

app.get('/', (req, res) => res.send('Comh API.'));

app.get('/whatsnew', whatsNewController.getWhatsNew);

app.post('/whatsnew', whatsNewController.addWhatsNew);

app.get('/file/:key', fileController.getFile);

io.on('connection', socket => {
  socket.on('join', ({ name, room }, callback) => chatControllers.join(socket, { name, room }, callback));

  socket.on('sendText', (data, callback) => chatControllers.sendText(io, socket, data, callback));

  socket.on('deleteText', (data, callback) => chatControllers.deleteText(io, socket, data, callback));

  socket.on('disconnect', () => chatControllers.disconnect(socket));
});

app.use((req, res, next) => {
  return next({ message: 'Not found', statusCode: 404 });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode);

  return res.json({ error: { message: err.message || 'Internal server error', statusCode } });
});

module.exports = server;
