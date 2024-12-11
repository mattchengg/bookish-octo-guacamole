import plugin from '../plugin.json';
import * as os from 'os';

const toast = acode.require('toast');
const loader = acode.require("loader");
const fs = acode.require("fs");

class AcodePlugin {

  async init() {
    toast(os.arch(), 3000);
    editorManager.on("switch-file")
    editorManager.on("save-file")
    editorManager.on("file-content-changed")
  }
  

  async destroy() {
    // plugin clean up
  }
}

if (window.acode) {
  const acodePlugin = new Wakatime();
  acode.setPluginInit(plugin.id, async (baseUrl, $page, { cacheFileUrl, cacheFile }) => {
    if (!baseUrl.endsWith('/')) {
      baseUrl += '/';
    }
    acodePlugin.baseUrl = baseUrl;
    await acodePlugin.init($page, cacheFile, cacheFileUrl);
  });
  acode.setPluginUnmount(plugin.id, () => {
    acodePlugin.destroy();
  });
}
