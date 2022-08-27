
const { ccclass, property } = cc._decorator;

import * as NetworkNode from './network-node.js'
import * as NetworkTip from './network-tip.js'
import * as NetworkManager from './network-manager.js'
import * as ProtocolHelper from './protocol-helper.js'
import * as Socket from './web-socket.js'

@ccclass
export default class NewClass extends cc.Component {

    @property(cc.EditBox)
    urlEditBox: cc.EditBox = null;

    @property(cc.EditBox)
    contentEditBox: cc.EditBox = null;

    @property(cc.Node)
    contentParent: cc.Node = null;

    @property(cc.Prefab)
    clientPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    serverPrefab: cc.Prefab = null;

    onLoad() {
        const networkNode = new NetworkNode(new Socket(), new ProtocolHelper(), new NetworkTip());
        networkNode.addListener(1, (msg) => {
            this.addServer(msg);
        });
        NetworkManager.getInstance().addNetworkNode(0, networkNode);
    }

    addClient(msg) {
        const node = cc.instantiate(this.clientPrefab);
        node.getComponent(cc.Label).string = msg;
        node.parent = this.contentParent;
    }

    addServer(msg) {
        const node = cc.instantiate(this.serverPrefab);
        node.getComponent(cc.Label).string = msg;
        node.parent = this.contentParent;
    }

    onClickConnect() {
        NetworkManager.getInstance().connect(0, { url: this.urlEditBox.string });
    }

    onClickSend() {
        if (this.contentEditBox.string !== '') {
            this.addClient(this.contentEditBox.string);
            NetworkManager.getInstance().request(0, this.contentEditBox.string, 0);
        }
    }

    onClickClose() {
        NetworkManager.getInstance().close(0);
    }
}
