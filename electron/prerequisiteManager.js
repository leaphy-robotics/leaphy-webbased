class PrerequisiteManager {
    constructor(arduinoCli, executable, os, app, path, firstRun) {
        this.arduinoCli = arduinoCli;
        this.executable = executable;
        this.os = os;
        this.firstRun = firstRun;
        if (os.platform != "win32") return;
        this.boardDriverInstallerPath = this.getBoardDriverInstallerPath(os, app, path);
    }

    verifyInstallation = async (event, payload) => {
        const checkingPrerequisitesMessage = { event: "PREPARING_COMPILATION_ENVIRONMENT", message: "PREPARING_COMPILATION_ENVIRONMENT", payload: payload.name, displayTimeout: 0 };
        event.sender.send('backend-message', checkingPrerequisitesMessage);

        const updateCoreIndexParams = ["core", "update-index"];
        const updateLibIndexParams = ["lib", "update-index"];

        await this.verifyInstalledCoreAsync(event, payload.name, payload.core);
        await this.verifyInstalledLibsAsync(event, payload.name, payload.libs);

        const installationVerifiedMessage = { event: "INSTALLATION_VERIFIED", message: "INSTALLATION_VERIFIED", payload: payload.name, displayTimeout: 3000 };
        event.sender.send('backend-message', installationVerifiedMessage);
    }

    installUsbDriver = async (event) => {
        // Only do this for windows
        const platform = this.os.platform;
        if (platform != "win32") return;

        try {
            await this.executable.runAsync(this.boardDriverInstallerPath, []);
        } catch (error) {
            this.firstRun.clear();
            return;
        }
        
        const driverInstallationSuccessMessage = { event: "DRIVER_INSTALLATION_COMPLETE", message: "DRIVER_INSTALLATION_COMPLETE", displayTimeout: 3000 };
        event.sender.send('backend-message', driverInstallationSuccessMessage);
    }

    installCore = async (core) => {
        const installCoreParams = ["core", "install", core];
    }

    upgradeCore = async (core) => {
        const upgradeCoreParams = ["core", "upgrade", core];
    }

    installLib = async (library) => {
        const installLibParams = ["lib", "install", library];
    }

    upgradeLib = async (library) => {
        const upgradeLibParams = ["lib", "upgrade", library];
    }

    verifyInstalledCoreAsync = async (event, name, core) => {
        const checkCoreParams = ["core", "list", "--format", "json"];
        const installedCores = JSON.parse(await this.arduinoCli.runAsync(checkCoreParams));
        const isRequiredCoreInstalled = installedCores.map(v => v.ID).includes(core);

        const installingCoreMessage = { event: "PREPARING_COMPILATION_ENVIRONMENT", message: "INSTALLING_ARDUINO_CORE", payload: name, displayTimeout: 0 };
        event.sender.send('backend-message', installingCoreMessage);

        if (isRequiredCoreInstalled) {
            await this.upgradeCore(core);
            return;
        };
        await this.installCore(core);
    }

    verifyInstalledLibsAsync = async (event, name, libs) => {
        const checkLibsParams = ["lib", "list", "--format", "json"];
        const installedLibs = JSON.parse(await this.arduinoCli.runAsync(checkLibsParams));
        const installedLibsRealNames = installedLibs.map(l => l.library.real_name);

        const installingLibsMessage = { event: "PREPARING_COMPILATION_ENVIRONMENT", message: "INSTALLING_LEAPHY_LIBRARIES", payload: name, displayTimeout: 0 };
        event.sender.send('backend-message', installingLibsMessage);

        libs.forEach(async requiredLib => {
            if(installedLibsRealNames.includes(requiredLib)){
                await this.installLib(requiredLib); // Should be upgrade but that's not working, see https://github.com/arduino/arduino-cli/issues/1041
            } else {
                await this.installLib(requiredLib);
            }
        });
    }

    getBoardDriverInstallerPath = (os, app, path) => {
        let platformFolder;
        let board_driver_installer;
        const platform = os.platform;
        if (platform == "win32") {
            platformFolder = "win32";
            board_driver_installer = "Driver_for_Windows.exe";
        } 
        const boardDriverInstallerPath = path.join(app.getAppPath(), 'lib', platformFolder, 'board_driver_installer', board_driver_installer);
        return boardDriverInstallerPath;
    }
}

module.exports = PrerequisiteManager;