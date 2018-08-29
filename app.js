const express = require('express');
const http = require('http');
const static = require('serve-static');
const path = require('path');

const bodyParser = require('body-parser');

const socketio = require('socket.io')(http);
const cors = require('cors');

const app = express();

app.set('port', 3000);

app.use('/', static(path.join(__dirname, '/')));

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.use(cors());


const server = http.createServer(app).listen(app.get('port'), function(){
    console.log('익스프레스로 웹 서버를 실행함 : ' + app.get('port'));
});


const io = socketio.listen(server);
console.log('socket.io 요청을 받아들일 준비가 되었습니다.');

var login_ids={};

io.sockets.on('connection', function(socket) {
    console.log('connection info -> ' + JSON.stringify(socket.request.connection._peername));
    
    socket.remoteAddress = socket.request.connection._peername.address;
    socket.remotePort = socket.request.connection._peername.port;
    
    
    socket.on('login', function(input) {
        console.log('login 받음 -> ' + JSON.stringify(input));
        
        login_ids[input.id] = socket.id;
        socket.login_id = input.id; //양 방향으로 설정
        
        sendResponse(socket, 'login', 200, 'OK');
    });
    
    socket.on('message', function(message) {
       console.log('message 받음 -> ' + JSON.stringify(message));
        
        if(message.recepient == 'ALL') {
            console.log('모든 클라이언트에게 메시지 전송함.');
            
            io.sockets.emit('message', message);
        } else {
            if(login_ids[message.recepient]) {
                io.sockets.connected[login_ids[message.recepient]].emit('message', message);
                
                sendResponse(socket, 'message sending', 200, 'OK');
            } else {
                sendResponse(socket, 'message sending', 400, '수신자 ID를 찾을 수 없습니다.');
            }
        }
    });
});

function sendResponse(socket, command, code, message) {
    var output = {
        command:command,
        code:code,
        message:message
    };
    
    socket.emit('response', output);
}