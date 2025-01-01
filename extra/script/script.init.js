const { exec } = require("child_process");
const os = require("os");

switch (os.platform()) {
    case "win32":
        exec("entrypoint-no-docker.cmd", (error, stdout, stderr) => {
            if (error) {
                console.log(`[ERROR]: ${error.message}`);
                return;
            }

            if (stderr) {
                console.error(`[ERROR] : ${stderr}`);
                return;
            }
            console.log(`[INFO] ${stdout}`);
        });
        break;
    case "linux":
        exec("entrypoint-no-docker.sh", (error, stdout, stderr) => {
            if (error) {
                console.log(`[ERROR]: ${error.message}`);
                return;
            }

            if (stderr) {
                console.error(`[ERROR] : ${stderr}`);
                return;
            }
            console.log(`[INFO] ${stdout}`);
        });
        break;
}