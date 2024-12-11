import plugin from '../plugin.json';
import Dependencies from './cli/Dependencies.js';

const toast = acode.require('toast');
const loader = acode.require("loader");
const fs = acode.require("fs");

class Wakatime {
    constructor() {
        this.dependencies = new Dependencies();
        this.lastHeartbeat = 0;
        this.lastFile = null;
        this.HEARTBEAT_INTERVAL = 120000;
        this.baseUrl = '';
        this.configFile = `${acode.runtime.PLUGIN_DIR}/${plugin.id}/.wakatime.cfg`;
    }

    async init($page, cacheFile, cacheFileUrl) {
        try {
            toast('正在初始化 WakaTime...', 3000);

            // 確保配置文件存在
            await this.ensureConfigFile();

            // 檢查並安裝 CLI
            await this.dependencies.checkAndInstallCli();

            // 設置事件監聽器
            this.setupEventListeners();

            loader.hide();
            toast('WakaTime 初始化完成', 3000);
        } catch (error) {
            loader.hide();
            console.error('WakaTime 初始化失敗:', error);
            toast('WakaTime 初始化失敗', 3000);
        }
    }

    async ensureConfigFile() {
        try {
            if (!await fs(this.configFile).exists()) {
                const apiKey = await this.promptForApiKey();
                if (!apiKey) {
                    throw new Error('需要 API key 才能繼續');
                }
                const config = `[settings]\napi_key = ${apiKey}\n`;
                await fs(this.configFile).writeFile(config);
            }
        } catch (error) {
            console.error('配置文件設置失敗:', error);
            throw error;
        }
    }

    async promptForApiKey() {
        try {
            const apiKey = await acode.prompt(
                'WakaTime API Key', 
                '請輸入您的 WakaTime API key\n可以從 https://wakatime.com/settings/api-key 取得',
                '',
                {
                    required: true,
                    placeholder: 'waka_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
                }
            );
            return apiKey;
        } catch (error) {
            console.error('API key 輸入失敗:', error);
            return null;
        }
    }

    setupEventListeners() {
        editorManager.on("switch-file", this.handleFileSwitch.bind(this));
        editorManager.on("save-file", this.handleFileSave.bind(this));
        editorManager.on("file-content-changed", this.handleFileChange.bind(this));
    }

    async handleFileSwitch(file) {
        if (!file) return;
        await this.sendHeartbeat(file, false);
    }

    async handleFileSave(file) {
        if (!file) return;
        await this.sendHeartbeat(file, true);
    }

    async handleFileChange(file) {
        if (!file) return;
        
        const currentTime = Date.now();
        if (currentTime - this.lastHeartbeat >= this.HEARTBEAT_INTERVAL || this.lastFile !== file.filename) {
            await this.sendHeartbeat(file, true);
        }
    }

    async sendHeartbeat(file, isWrite) {
        try {
            const cliPath = this.dependencies.getCliLocation();
            const filePath = file.location || file.filename || file.name;
            
            // 準備 CLI 命令參數
            const args = [
                '--file', filePath,
                '--plugin', `Acode/${plugin.version}`,
                '--project', this.getProjectName(),
                isWrite ? '--write' : ''
            ].filter(Boolean); // 移除空值

            // 執行 CLI 命令
            const process = await window.createProcess(cliPath, args);
            const result = await process.execute();

            if (result.code === 0) {
                this.lastHeartbeat = Date.now();
                this.lastFile = filePath;
            } else {
                console.error('CLI 執行失敗:', result.stderr);
            }
        } catch (error) {
            console.error('發送心跳時發生錯誤:', error);
        }
    }

    getProjectName() {
        const activeFile = editorManager.activeFile;
        if (activeFile && activeFile.location) {
            const parts = activeFile.location.split('/');
            return parts[parts.length - 2] || 'Untitled';
        }
        return 'Untitled';
    }

    destroy() {
        editorManager.off("switch-file");
        editorManager.off("save-file");
        editorManager.off("file-content-changed");
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