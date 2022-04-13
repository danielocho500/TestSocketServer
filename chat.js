const  randomCode  = require('./helpers/randomCode');

const uuidv4 = require('uuid').v4;

const users = new Map();

const rooms = new Map();

const defaultUser = {
  id: 'anon',
  name: 'Anonymous',
};

class Connection {
  constructor(io, socket) {
    this.socket = socket;
    this.io = io;

    socket.on('getMessages', () => this.getMessages());
    socket.on('message', (value) => this.handleMessage(value));
    socket.on('disconnect', () => this.disconnect());
    socket.on('connect_error', (err) => {
      console.log(`connect_error due to ${err.message}`);
    });
    socket.on('newRoom',(val) => this.createRoom(val));
    socket.on('joinCode',(val) => this.joinRoom(val))
  }

  createRoom(values){
    if (values.type == "new"){
      const code = randomCode();

      rooms.set(code, {
        messages: [

        ]
      })

      users.set(this.socket.id, {
        code,
        name: values.name 
      });
      
      this.socket.join(code);
      this.socket.emit('join',code);
    }
  }

  joinRoom(values){

    if(rooms.has(Number(values.code))){
      users.set(this.socket.id,{
        code: values.code,
        name: values.name
      })
  
      this.socket.join(Number(values.code));
      this.socket.emit('join',Number(values.code));
    }
    else{
      console.log('incorrecto')
    }
  }
  
  sendMessage(message) {
    const code = users.get(this.socket.id).code
    this.io.sockets.to(Number(code)).emit('message', message)
  }
  
  getMessages() {
    const code = users.get(this.socket.id).code
    
    rooms.get(Number(code)).messages.forEach(msg => {
      this.sendMessage(msg);
    })
  }

  handleMessage(value) {
     const message = {
       id: uuidv4(),
       user: users.get(this.socket.id) || defaultUser,
       value,
       time: Date.now()
     };

     const code = users.get(this.socket.id).code
     rooms.get(Number(code)).messages
     rooms.get(Number(code)).messages.push(message);

     
     this.sendMessage(message);

  }

  disconnect() {
    try{
      const code = users.get(this.socket.id).code
    users.delete(code);
    }
    catch{}
    
  }
}

function chat(io) {
  io.on('connection', (socket) => {
    new Connection(io, socket);   
  });
};

module.exports = chat;