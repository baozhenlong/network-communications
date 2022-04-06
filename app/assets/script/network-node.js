// 网络节点
const NetworkTipTypeEnum = {
    Connecting: 0,
    Reconnecting: 1,
    Requesting: 2,
};
const NetworkNodeStateEnum = {
    // 已关闭
    Closed: 0,
    // 连接中
    Connecting: 1,
    // 可传输数据
    Working: 2,
};

class NetworkNode {

    constructor(socket, protocolHelper, networkTip) {
        this.socket = socket;
        this.protocolHelper = protocolHelper;
        this.networkTip = networkTip;
        this.state = NetworkNodeStateEnum.Closed;
        this.isSocketInit = false;
        /** @type {{buffer: Network.NetData, id: number, response: {callback: Function, target: Object}}[]} */

        this.requests = [];
        /** 多久没收到数据就断开 */

        this.closeInterval = 6000 * 1000;
        this.closeTimer = null;
        /** 心跳间隔 */

        this.heartbeatInterval = 10 * 1000;
        this.heartbeatTimer = null;
        /**
         * 回调执行
         * @type {({callback: Function, target: Object}, Network.NetData)=>void}
         */

        this.callbackExecuter = ({ callback, target }, buffer) => {
            callback.call(target, Buffer.from(buffer).toString());
        };
        /**
         * 监听者列表
         * @type {{[key: number]: {callback: Function, target: Object}[]}}
         */


        this.listenerMap = {};
        /**
         * 断线回调
         * @type {Function}
         */

        this.closeCallback = null;
        this.reconnectTimes = 0;
        this.reconnectTimer = null;
        this.reconnectInterval = 800 * 1000;
    }

    /**
     *
     * @param {{
     * url?:string,
     * host?: string,
     * port?: number,
     * protocol?: string,
     * reconnectTimes?: number
     * }} options
     * @see reconnectTimes 0 不自动重连，其他正整数为自动重连次数
     * @returns
    */
    connect(options) {
        if (this.socket && this.state === NetworkNodeStateEnum.Closed) {
            if (options.reconnectTimes !== undefined) {
                this.reconnectTimes = options.reconnectTimes;
            }

            if (!this.isSocketInit) {
                this.initSocket();
            }

            this.state = NetworkNodeStateEnum.Connecting;
            const connect = this.socket.connect(options);

            if (!connect) {
                this.updateNetworkTip(NetworkTipTypeEnum.Connecting, false);

                return false;
            }

            this.options = options;
            this.updateNetworkTip(NetworkTipTypeEnum.Connecting, true);

            return true;
        }

        return false;
    }

    initSocket() {

        this.socket.onOpen = (event) => {
            this.onOpen(event);
        };

        this.socket.onMessage = (event) => {
            this.onMessage(event);
        };

        this.socket.onError = (event) => {
            this.onError(event);
        };

        this.socket.onClose = (event) => {
            this.onClose(event);
        };

        this.isSocketInit = true;
    }

    updateNetworkTip(tipType, visible) {
        if (this.networkTip) {
            if (tipType === NetworkTipTypeEnum.Connecting) {
                this.networkTip.connectTip(visible);
            }
            else if (tipType === NetworkTipTypeEnum.Reconnecting) {
                this.networkTip.reconnectTip(visible);
            }
            else if (tipType === NetworkTipTypeEnum.Requesting) {
                this.networkTip.requestTip(visible);
            }
        }
    }

    onOpen(event) {
        this.state = NetworkNodeStateEnum.Working;
        console.log('连接成功', this.options, this.state);
        this.updateNetworkTip(NetworkTipTypeEnum.Connecting, false);
        this.updateNetworkTip(NetworkTipTypeEnum.Reconnecting, false); // 重连待发送消息

        if (this.requests.length > 0) {
            for (let i = 0, len = this.requests.length; i < len; i++) {
                const request = this.requests[i];
                this.socket.send(request.buffer);

                if (request.response === null || request.id === 0) {
                    this.requests.splice(i, 1);
                }
                else {
                    i += 1;
                }
            }

            this.updateNetworkTip(NetworkTipTypeEnum.Requesting, this.requests.length > 0);
        }
    }

    onMessage(msg) {

        // 进行数据校验
        if (!this.protocolHelper.checkPackage(msg)) {
            console.log('数据包错误');

            return;
        } // 重置超时关闭计时器


        this.resetCloseTimer(); // 重置心跳包计时器

        this.resetHeartbeatTimer(); // 触发消息执行

        const id = this.protocolHelper.getPackageId(msg); // 优先触发 request 队列

        if (this.requests.length > 0) {
            for (let i = 0, len = this.requests.length; i < len; i++) {
                if (this.requests[i].id === id) {
                    this.callbackExecuter(this.requests[i].response, msg);
                    this.requests.splice(i, 1);
                    break;
                }
            }

            if (this.requests.length === 0) {
                this.updateNetworkTip(NetworkTipTypeEnum.Requesting, false);
            }
        }

        const listeners = this.listenerMap[id];

        if (listeners) {
            listeners.forEach((response) => {
                this.callbackExecuter(response, msg);
            });
        }
    }

    resetCloseTimer() {

        if (this.closeTimer !== null) {
            clearTimeout(this.closeTimer);
        }

        this.closeTimer = setTimeout(() => {
            console.log('超时关闭');

            this.socket.close();
        }, this.closeInterval);
    }

    resetHeartbeatTimer() {


        if (this.heartbeatTimer !== null) {
            clearTimeout(this.heartbeatTimer);
        }

        this.heartbeatTimer = setTimeout(() => {
            console.log('发送心跳包');

            this.socket.send(this.protocolHelper.getHeartbeat());
        }, this.heartbeatInterval);
    }

    onError(event) {
        console.error(event);
    }

    clearTimer() {
        if (this.closeInterval !== null) {
            clearTimeout(this.closeTimer);
        }

        if (this.heartbeatTimer !== null) {
            clearTimeout(this.heartbeatTimer);
        }

        if (this.reconnectTimer !== null) {
            clearTimeout(this.reconnectTimer);
        }
    }

    onClose(event) {

        console.log('触发关闭了', event);
        this.clearTimer();

        if (this.closeCallback) {
            this.closeCallback(event);
        } // 自动重连


        if (this.reconnectTimes > 0) {
            this.updateNetworkTip(NetworkTipTypeEnum.Reconnecting, true);
            this.reconnectTimer = setTimeout(() => {
                this.state = NetworkNodeStateEnum.Closed;
                console.log('连接关闭');

                this.connect(this.options);

                this.reconnectTimes -= 1;
            }, this.reconnectInterval);
        }
        else {
            this.state = NetworkNodeStateEnum.Closed;
            console.log('连接关闭');
        }
    }

    close(code, reason) {
        this.clearTimer();
        this.listenerMap = {};
        this.requests.length = 0;

        if (this.networkTip) {
            this.networkTip.connectTip(false);
            this.networkTip.reconnectTip(false);
            this.networkTip.requestTip(false);
        }

        if (this.socket) {
            this.socket.close(code, reason);
        }
        else {
            console.log('连接关闭');
            this.state = NetworkNodeStateEnum.Closed;
        }
    }

    // 只是关闭 socket，仍然重用缓存和当前状态
    closeSocket(code, reason) {
        if (this.socket) {
            this.socket.close(code, reason);
        }
    }

    // 发起请求
    send(buffer) {

        if (this.state === NetworkNodeStateEnum.Working) {
            return this.socket.send(buffer);
        }

        if (this.state === NetworkNodeStateEnum.Connecting) {
            this.requests.push({
                buffer,
                id: 0,
                response: null,
            });
            console.log('正在连接中');

            return true;
        }

        return false;
    }

    // 发起请求并进入缓存列表
    request(buffer, id, response, showTip) {
        this.requests.push({
            buffer,
            id,
            response,
        });

        if (showTip) {
            this.updateNetworkTip(NetworkTipTypeEnum.Requesting, true);
        }
        if (this.state === NetworkNodeStateEnum.Working) {
            this.socket.send(buffer);
        }
    }

    // 确保没有同一响应请求（避免一个请求重复发送）
    requestUnique(buffer, id, response, showTip) {
        for (let i = 0, len = this.requests.length; i < len; i++) {
            if (this.requests[i].id === id) {
                console.log('重复的请求');

                return false;
            }
        }

        this.request(buffer, id, response, showTip);

        return true;
    }

    addListener(id, callback, target) {
        if (!callback) {
            console.error('没有回调函数');

            return false;
        }

        if (!this.listenerMap[id]) {
            this.listenerMap[id] = [{
                callback,
                target,
            }];
        }
        else if (this.getListenerIndex(id, callback, target) !== -1) {
            this.listenerMap[id].push({
                callback,
                target,
            });
        }

        return true;
    }

    removeLister(id, callback, target) {
        if (callback && this.listenerMap[id]) {
            const index = this.getListenerIndex(id, callback, target);

            if (index !== -1) {
                this.listenerMap[id].splice(index, 1);
            }
        }
    }

    clearListener(id = -1) {
        if (id === -1) {
            this.listenerMap = {};
        }
        else {
            delete this.listenerMap[id];
        }
    }

    getListenerIndex(id, callback, target) {
        let index = -1;

        for (let i = 0, len = this.listenerMap[id].length; i < len; i++) {
            const response = this.listenerMap[id][i];

            if (callback === response.callback && target === response.target) {
                index = i;
                break;
            }
        }

        return index;
    }

}


module.exports = NetworkNode;
