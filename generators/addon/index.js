const path = require('path');
const fse = require('fs-extra');
const Generator = require('yeoman-generator');
const askName = require('inquirer-npm-name');
const {
    safePkgName,
    extend
} = require('../../utils/utils');

module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts);

        this.option('sdk', {
            type: Boolean,
            required: false,
            default: false,
            desc: 'include native sdk'
        });

        this.option('tool', {
            type: Boolean,
            required: false,
            default: false,
            desc: 'include tool scripts'
        });
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

    async prompting() {
        await this._askName();
    }

    _askName() {
        let askedName;

        if (this.props.name) {
            askedName = Promise.resolve({
                name: this.props.name
            });
        } else {
            askedName = askName({
                name: 'name',
                default: path.basename(process.cwd())
            },
            this
            );
        }

        return askedName.then(answer => {
            Object.assign(this.props, {
                name: answer.name
            });
        });
    }

    default () {
        if (this.options.sdk) {
            this.log('sdk is true');
        }
        if (this.options.tool) {
            this.log('tool is true');
            this.composeWith(require.resolve('../tool'));
        }
    }

    writing() {
        const currentPkg = this.fs.readJSON(this.destinationPath('package.json'), {});
        const pkg = extend({
            name: this.props.name,
            version: '0.1.0',
            description: this.props.description,
            author: {
                name: this.props.authorName,
                email: this.props.authorEmail,
            },
            main: './js/index.js',
            types: './js/index.d.ts',
            dependencies: {
                'node-addon-api': '^1.4.0',
                'node-gyp': '^3.7.0'
            },
            scripts: {
                'install': 'node-gyp rebuild',
                'build': 'node-gyp build',
                'compile': 'node-gyp rebuild',
            }
        }, currentPkg);

        this.fs.writeJSON(this.destinationPath('package.json'), pkg);

        const files = [
            'js/index.js',
            'js/index.d.ts',
            'src/main.cc',
            'binding.gyp'
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

        if (this.options.sdk) {
            fse.ensureDirSync(this.destinationPath('sdk'));
            fse.ensureDirSync(this.destinationPath('sdk/include'));
            fse.ensureDirSync(this.destinationPath('sdk/lib'));
            fse.ensureDirSync(this.destinationPath('sdk/bin'));
        }
    }
};