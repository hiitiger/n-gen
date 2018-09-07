const fs = require('fs');

const _ = require('lodash');
const extend = _.merge;

function safePkgName(str){
    return str.replace(/-/g, '_');
}

function readLines(file) {
    return new Promise((resolve, reject) => {
        fs.readFile(file, {encoding: 'utf-8'}, (err, data) => {
            if(err) {
                reject(err);
            }
            else{
                const lines = data.split(/\r?\n/);
                resolve(lines);
            }
        });
    });
}


exports.readLines = readLines;
exports.safePkgName = safePkgName;
exports.extend = extend;

