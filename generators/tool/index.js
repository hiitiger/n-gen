const Generator = require('yeoman-generator');
const fse = require('fs-extra');
const {
    readLines,
    safePkgName,
    extend
} = require('../../utils/utils');

module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts);
    }

    initializing() {
        this.pkg = this.fs.readJSON(this.destinationPath('package.json'), {});
        this.props = {
            name: this.pkg.name,
            description: this.pkg.description,
            version: this.pkg.version,
            homepage: this.pkg.homepage,
            repositoryName: this.options.repositoryName
        };
    }

    async writing() {
        const currentPkg = this.fs.readJSON(this.destinationPath('package.json'), {});
        const pkg = extend({
            scripts: {
                'release': 'node ./tool/release.js',
            },
            devDependencies: {
                'colors': '^1.3.2',
            }
        }, currentPkg);

        this.fs.writeJSON(this.destinationPath('package.json'), pkg);

        const files = [
            'tool/prelease.js',
            'tool/release.js',
        ];

        files.forEach((value) => {
            this.fs.copyTpl(
                this.templatePath(value + '.tmpl'),
                this.destinationPath(value), {
                    pkgName: pkg.name,
                    pkgSafeName: safePkgName(pkg.name),
                }
            );
        });

        await this._writeNpm();
    }

    async _writeNpm() {
        const npmingore = this.destinationPath('.npmignore');
        await fse.ensureFile(npmingore);
        const lines = await readLines(npmingore);
        if (lines.indexOf('tool') == -1) {
            lines.push('tool');
        }
        return fse.writeFile(npmingore, lines.join('\n'), {
            encoding: 'utf-8'
        });
    }
};