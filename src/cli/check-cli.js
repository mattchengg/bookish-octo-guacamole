import plugin from '../plugin.json';

const adm_zip = require('adm-zip');
const child_process = require('child_process');
const fs = acode.require("fs");

class Dependencies {
  constructor() {
    this.cliLocation = undefined;
    this.cliLocationGlobal = undefined;
    this.cliInstalled = false;
    this.githubDownloadPrefix = 'https://github.com/wakatime/wakatime-cli/releases/download';
    this.githubReleasesStableUrl = 'https://api.github.com/repos/wakatime/wakatime-cli/releases/latest';
    this.githubReleasesAlphaUrl = 'https://api.github.com/repos/wakatime/wakatime-cli/releases?per_page=1';
    this.latestCliVersion = '';
  }
  
  isCliInstalled(): boolean {
    if (this.cliInstalled) return true;
    this.cliInstalled = fs(this.getCliLocation).exists();
    return this.cliInstalled;
  }
  
  checkAndInstallCli(callback) {
    if (!this.isCliInstalled()) {
      this.installCli(callback);
    } else {
      this.isCliLatest((isLatest) => {
        if (!isLatest) {
          this.installCli(callback);
        } else {
          callback();
        }
      });
    }
  }
  
  isCliInstalled() {
    const exists = await fs(PLUGIN_DIR/plugin.id/.wakatime/wakatime-cli-android-arm64).exists();
    return exists; // 預設回傳 false
  }
  
  async downloadCli() {
    try {
      const version = await this.getLatestCliVersion();
      const downloadUrl = this.getDownloadUrl(version);
      
      // 使用 fetch 下載檔案
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      
      // TODO: 儲存檔案
      console.log('下載完成', blob);
    } catch (error) {
      console.error('下載失敗', error);
    }
  }
  
  async getLatestCliVersion() {
    try {
      const response = await fetch(
        'https://api.github.com/repos/wakatime/wakatime-cli/releases/latest'
      );
      const data = await response.json();
      return data.tag_name;
    } catch (error) {
      console.error('無法取得版本', error);
      return null;
    }
  }
  
  getDownloadUrl(version) {
    return `${this.githubDownloadPrefix}/${version}/wakatime-cli-android-arm64.zip`;
  }
}
