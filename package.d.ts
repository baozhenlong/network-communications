declare namespace Network {

    type NetData = string | ArrayBuffer | Blob | ArrayBufferView;

    type Socket = import('@/network/web-socket');

    type ProtocolHelper = import('@/network/protocol-helper');

    type NetworkTip = import('@/network/network-tip');

    type NetworkNode = import('@/network/network-node');
}