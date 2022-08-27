class NetworkManager {

    constructor() {
        /**
     * @type {{[key: number]: Network.NetworkNode}}
     */
        this.channels = {};
        this.instance = null;
    }

    static getInstance() {
        if (!this.instance) {
            this.instance = new NetworkManager();
        }

        return this.instance;
    }

    addNetworkNode(channelId, networkNode) {
        this.channels[channelId] = networkNode;
    }

    removeNetworkNode(channelId) {
        delete this.channels[channelId];
    }

    connect(channelId, options) {
        if (this.channels[channelId]) {
            return this.channels[channelId].connect(options);
        }

        return false;
    }

    send(channelId, buffer) {
        const networkNode = this.channels[channelId];

        if (networkNode) {
            return networkNode.send(buffer);
        }

        return false;
    }

    request(channelId, buffer, id, response, showTip) {
        const networkNode = this.channels[channelId];

        if (networkNode) {
            return networkNode.request(buffer, id, response, showTip);
        }

        return false;
    }

    requestUnique(channelId, buffer, id, response, showTip) {
        const networkNode = this.channels[channelId];

        if (networkNode) {
            return networkNode.requestUnique(buffer, id, response, showTip);
        }

        return false;
    }

    close(channelId, code, reason) {
        const networkNode = this.channels[channelId];

        if (networkNode) {
            return networkNode.close(code, reason);
        }

        return false;
    }

}

module.exports = NetworkManager;
