/* eslint no-console: off */
const fs = require('fs');
const path = require('path');

module.exports = {
    link() {
        const mod = path.resolve(__dirname, 'node_modules');
        if (!fs.existsSync(mod)) {
            fs.mkdirSync(mod);
        }

        const app = path.resolve(__dirname, 'app');
        const src = path.relative(mod, app);
        const dest = path.join(mod, '@');
        if (!fs.existsSync(dest)) {
            fs.symlinkSync(src, dest, 'junction');
            console.log(`>> Linked ./app to ${dest}\n`);
        }
    },

    unlink() {
        const mod = path.resolve(__dirname, 'node_modules');
        if (!fs.existsSync(mod)) {
            console.warn(`>> ${mod} not exists\n`);

            return;
        }

        const dest = path.resolve(__dirname, 'node_modules', '@');
        if (fs.existsSync(dest) && fs.lstatSync(dest).isSymbolicLink()) {
            fs.unlinkSync(dest);
            console.log(`>> Unlinked ${dest}\n`);
        }
    },
};
