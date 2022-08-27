class Socket {

    constructor() {
        this.ws = null;
    }

    onOpen(event) {}

    onMessage(msg) {}

    onError(event) {}

    onClose(event) {}

    connect(options) {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            console.log('WebSocket connecting, please wait for a moment');

            return false;
        }

        let url;

        if (options.url) {
            url = options.url;
        }
        else {
            const host = options.host;
            const port = options.port;
            const protocol = options.protocol;
            url = `${protocol}://${host}:${port}`;
        }

        this.ws = new WebSocket(url);
        this.ws.binaryType = options.binaryType ? options.binaryType : 'arraybuffer';

        this.ws.onmessage = (event) => {
            this.onMessage(event.data);
        };

        this.ws.onopen = this.onOpen;
        this.ws.onerror = this.onError;
        this.ws.onclose = this.onClose;

        return true;
    }

    send(buffer) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('发送', buffer);
            this.ws.send(buffer);

            return true;
        }

        return false;
    }

    close(code, reason) {
        if (this.ws) {
            this.ws.close(code, reason);
        }
    }

}

module.exports = Socket;
