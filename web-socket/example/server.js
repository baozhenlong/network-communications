const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 8008 });

server.on('connection', (client) => {
    console.log('connected');
    client.on('open', () => {
        console.log('client connected');
    });

    client.on('message', (data) => {
        console.log('message', data.toString());
        broadcast(data);
    });
});

server.on('close', () => {
    console.log('disconnected');
});

function broadcast(data) {
    server.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}
