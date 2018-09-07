const {
    spawnSync
} = require('child_process');

const fs = require('fs');
const path = require('path');

const colors = require('colors/safe');

function getPackage() {
    const data = fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8');
    const pkg = JSON.parse(data);
    return pkg;
}

function checkBranch(branch) {
    const command = ['checkout', branch];
    return runGit(command);
}

function checkNewBranch(branch) {
    const command = ['checkout', '-b', branch];
    return runGit(command);
}

function pushBranchToRemote(branch) {
    const command = ['push', '-u', 'origin', branch];
    return runGit(command);
}

function logSpawnResult(res) {
    if (Buffer.isBuffer(res.stdout)) {
        res.stdout = res.stdout.toString('utf-8');
    }
    if (Buffer.isBuffer(res.stderr)) {
        res.stderr = res.stderr.toString('utf-8');
    }

    console.log(colors.green(`status: ${res.status}`));
    console.log(colors.green(res.stdout));
    console.log(colors.green(res.stderr));
}

function runGit(command) {
    console.log(colors.blue(command));
    const res = spawnSync('git', command);
    logSpawnResult(res);
}

function run() {
    const pkg = getPackage();
    console.log(pkg);
    const version = pkg.version;
    const branch = 'release/' + version;
    checkNewBranch(branch);
    checkBranch(branch);
    pushBranchToRemote(branch);
}

run();