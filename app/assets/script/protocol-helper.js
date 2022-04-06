class ProtocolHelper {

    /**
     * 获取包头长度
     */
    getHeadLen() {
        return 0;
    }

    /**
     * 获取心跳包
     */
    getHeartbeat() {
        return 'heart';
    }

    /**
     * 获取整个包的长度
     */
    getPackageLen(msg) {
        return 0;
    }

    /**
     * 检查包数据是否合法
     */
    checkPackage(msg) {
        return true;
    }

    /**
     * 获取包的 id
     */
    getPackageId(msg) {
        return 1;
    }

}

module.exports = ProtocolHelper;
