import plugin from '../../plugin.json';
import JSZip from 'jszip';
const fs = acode.require("fs");

class Dependencies {
    constructor() {
        this.cliLocation = null;
        this.cliLocationGlobal = null;
        this.cliInstalled = false;
        this.resourcesLocation = `${acode.runtime.PLUGIN_DIR}/${plugin.id}`;
        this.githubDownloadPrefix = 'https://github.com/wakatime/wakatime-cli/releases/download';
        this.githubReleasesStableUrl = 'https://api.github.com/repos/wakatime/wakatime-cli/releases/latest';
        this.githubReleasesAlphaUrl = 'https://api.github.com/repos/wakatime/wakatime-cli/releases?per_page=1';
        this.latestCliVersion = '';
    }

    getCliLocation() {
        if (this.cliLocation) return this.cliLocation;

        this.cliLocation = this.getCliLocationGlobal();
        if (this.cliLocation) return this.cliLocation;

        // Acode 在 Android 上運行
        const arch = 'arm64';
        const osname = 'android';
        
        this.cliLocation = `${this.resourcesLocation}/wakatime-cli-${osname}-${arch}`;
        return this.cliLocation;
    }

    getCliLocationGlobal() {
        return `${acode.runtime.PLUGIN_DIR}/${plugin.id}/.wakatime/`;
    }
  
    async isCliInstalled() {
        if (this.cliInstalled) return true;
        const cliPath = this.getCliLocation();
        this.cliInstalled = await fs(cliPath).exists();
        return this.cliInstalled;
    }
  
    async checkAndInstallCli() {
        try {
            if (!await this.isCliInstalled()) {
                await this.installCli();
            } else {
                const isLatest = await this.isCliLatest();
                if (!isLatest) {
                    await this.installCli();
                }
            }
            return true;
        } catch (error) {
            console.error('檢查和安裝 CLI 失敗', error);
            return false;
        }
    }
  
    async downloadCli() {
        try {
            const version = await this.getLatestCliVersion();
            const downloadUrl = this.getDownloadUrl(version);
            
            // 使用 fetch 下載檔案
            const response = await fetch(downloadUrl);
            const arrayBuffer = await response.arrayBuffer();
            
            // 使用 JSZip 解壓檔案
            const zip = new JSZip();
            await zip.loadAsync(arrayBuffer);
            
            // 取得 CLI 檔案
            const cliFile = zip.file(/wakatime-cli-android-arm64/)[0];
            if (!cliFile) {
                throw new Error('ZIP 檔案中找不到 CLI');
            }
            
            // 解壓並保存檔案
            const cliContent = await cliFile.async('arraybuffer');
            const cliPath = this.getCliLocation();
            await fs(cliPath).writeFile(cliContent);
            
            // 設置執行權限
            await fs(cliPath).chmod(0o755);
            
            console.log('CLI 安裝完成');
            return true;
        } catch (error) {
            console.error('CLI 安裝失敗', error);
            return false;
        }
    }
  
    async getLatestCliVersion() {
        try {
            const response = await fetch(this.githubReleasesStableUrl);
            const data = await response.json();
            this.latestCliVersion = data.tag_name;
            return this.latestCliVersion;
        } catch (error) {
            console.error('無法取得版本', error);
            return null;
        }
    }
  
    getDownloadUrl(version) {
        return `${this.githubDownloadPrefix}/${version}/wakatime-cli-android-arm64.zip`;
    }

    async isCliLatest() {
        try {
            const latestVersion = await this.getLatestCliVersion();
            // TODO: 實作版本比較邏輯
            return false; // 暫時返回 false 以確保更新
        } catch (error) {
            console.error('檢查版本失敗', error);
            return false;
        }
    }

    async installCli() {
        return await this.downloadCli();
    }
}

export default Dependencies;