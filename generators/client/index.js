const Generator = require('yeoman-generator');

const path = require('path');
const askName = require('inquirer-npm-name');
const {
    safePkgName,
    extend
} = require('../../utils/utils');

module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts);

        this.option('api', {
            type: Boolean,
            required: true,
            desc: 'include preload api'
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
        if (this.options.api) {
            this.log('api is true');
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
            main: './dist/main/main.js',
            dependencies: {
                'log4js': '^3.0.2',
                'fs-extra': '^7.0.0',
            },
            scripts: {
                'build': 'npm run build:main && npm run build:renderer',
                'build:main': 'tsc',
                'build:renderer': 'webpack --config webpack.config.renderer.js',
                'start': 'electron . --enable-logging',
                'compile:electron': 'electron-rebuild -v 3.0.0-beta.7 --arch=ia32',
                'package:dir': 'npm run build && electron-builder --dir'
            },
            devDependencies: {
                '@types/fs-extra': '^5.0.4',
                'cross-env': '^5.2.0',
                'devtron': '^1.4.0',
                'electron': '3.0.0-beta.7',
                'electron-builder': '^20.28.2',
                'electron-rebuild': '^1.8.1',
                'node-gyp': '^3.7.0',
                'tslint': '^5.10.0',
                'typescript': '^3.0.3',
                'webpack': '^4.16.5',
                'webpack-cli': '^3.1.0',
                'awesome-typescript-loader': '^5.2.0'
            },
            'build': {
                'productName': currentPkg.name || this.props.name,
                'compression': 'maximum',
                'directories': {
                    'buildResources': './assets',
                    'output': './release'
                },
                'win': {
                    'icon': 'app.ico'
                },
                'electronDist': './node_modules/electron/dist',
                'npmRebuild': false,
                'asar': true,
                'extraResources': [
                    'assets'
                ],
                'files': [{
                    'from': 'dist',
                    'to': 'dist',
                    'filter': [
                        '**/*',
                        '!**/*.map'
                    ]
                },
                {
                    'from': '.',
                    'to': '.',
                    'filter': [
                        'package.json'
                    ]
                }
                ]
            }
        }, currentPkg);

        this.fs.writeJSON(this.destinationPath('package.json'), pkg);

        const files = [
            'src/main/main.ts',
            'src/main/global.d.ts',
            'src/main/electron/singleinstance.ts',
            'src/main/electron/app-entry.ts',
            'src/main/electron/events.ts',
            'src/main/electron/webpreload.ts',
            'src/main/electron/native/sdk.ts',
            'src/main/electron/native/settings.ts',
            'src/main/electron/preload/sdk.ts',
            'src/main/electron/preload/settings.ts',
            'src/main/electron/preload/logger.ts',
            'src/main/utils/debug.ts',
            'src/main/utils/config.ts',
            'src/main/utils/logger.ts',

            'src/renderer/main.ts',
            'tslint.json',
            'tsconfig.json',
            'webpack.config.renderer.js',
        ];

        files.forEach((value) => {
            this.fs.copyTpl(
                this.templatePath(value + '.tmpl'),
                this.destinationPath(value), {
                    pkgName: pkg.name,
                    pkgSafeName: safePkgName(pkg.name)
                }
            );
        });

        this.fs.copy(this.templatePath('assets'), this.destinationPath('assets'));
        this.fs.copy(this.templatePath('dist'), this.destinationPath('dist'));
    }
};