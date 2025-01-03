const { exec, spawn } = require("child_process");
const { Command } = require("commander");
const os = require("os");

const program = new Command();

program.option('--opt <type>', 'Init option', 'docker');
program.parse();

const { opt } = program.opts();

const initPlan = {
    win32: () => {
        spawn('cmd.exe', ['/c', '.\\entrypoint-no-docker.bat'])
    },
    linux: () => {
        exec("sh entrypoint-no-docker.sh", (error, stdout, stderr) => {
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
    }
}

const initOption = {
    docker: {
        init: () => {
            exec('npm run compose:up');
        }
    },
    nodocker: {
        init: () => {
            initPlan[os.platform()]();
        }
    }
}

initOption[opt].init();