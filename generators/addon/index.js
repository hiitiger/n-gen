const path = require('path');
const fse = require('fs-extra');
const Generator = require('yeoman-generator');
const askName = require('inquirer-npm-name');
const {
    safePkgName,
    extend,
    makeSafeForCpp
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

        this.option('utils', {
            type: Boolean,
            required: false,
            default: false,
            desc: 'include utils code'
        });

        this.option('object', {
            type: String,
            required: false,
            default: '',
            desc: 'include object wrap'
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
        if (this.options.utils) {
            this.log('utils is true');
        }
        if (this.options.object) {
            this.log('object is true');
            this.props.object = makeSafeForCpp(this.options.object);
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
                'node-gyp': '^3.8.0'
            },
            scripts: {
                'install': 'node-gyp rebuild',
                'build': 'node-gyp build',
                'compile': 'node-gyp rebuild',
            }
        }, currentPkg);

        this.fs.writeJSON(this.destinationPath('package.json'), pkg);

        const currentGyp = this.fs.readJSON(this.destinationPath('binding.gyp'), {});
        const gypTempl = {
            'target_name': safePkgName(pkg.name),
            'include_dirs': [
                '<!@(node -p "require(\'node-addon-api\').include")',
                'src',
            ],
            'sources': [
                'src/main.cc',
            ],
            'defines': ['NAPI_DISABLE_CPP_EXCEPTIONS', 'UNICODE'],
            'cflags!': [
                '-fno-exceptions'
            ],
            'cflags_cc!': [
                '-fno-exceptions'
            ],
            'conditions': [
                [
                    'OS==\'win\'', {
                        'defines': [
                            '_UNICODE',
                            '_WIN32_WINNT=0x0601'
                        ],
                        'configurations': {
                            'Release': {
                                'msvs_settings': {
                                    'VCCLCompilerTool': {
                                        'ExceptionHandling': 1,
                                    }
                                }
                            },
                            'Debug': {
                                'msvs_settings': {
                                    'VCCLCompilerTool': {
                                        'ExceptionHandling': 1,
                                    }
                                }
                            }
                        }
                    }
                ]
            ]
        };

        if (this.options.utils) {
            gypTempl.sources = gypTempl.sources.concat([
                'src/utils/n-utils.h',
                'src/utils/win-utils.h',
                'src/utils/node_async_call.h',
                'src/utils/node_async_call.cc',
            ]);
        }

        if (this.props.object) {
            gypTempl.sources = gypTempl.sources.concat([
                `src/${this.props.object}.h`,
                `src/${this.props.object}.cc`,
            ]);
        }

        const gyp = extend({
            targets: [
                gypTempl
            ]
        }, currentGyp);

        this.fs.writeJSON(this.destinationPath('binding.gyp'), gyp);

        const tmplfiles = [
            'js/index.js',
            'js/index.d.ts',
        ];

        tmplfiles.forEach((value) => {
            this.fs.copyTpl(
                this.templatePath(value + '.tmpl'),
                this.destinationPath(value), {
                    pkgName: pkg.name,
                    pkgSafeName: safePkgName(pkg.name),
                }
            );
        });

        if (this.props.object) {
            ['h', 'cc'].forEach(value => {
                this.fs.copyTpl(
                    this.templatePath(`src/object.${value}.tmpl`),
                    this.destinationPath(`src/${this.props.object}.${value}`), {
                        objectName: this.props.object,
                    }
                );
            });

        }

        let files = [
            'src/main.cc',
        ];
        if (this.options.utils) {
            files = files.concat([
                'src/utils/n-utils.h',
                'src/utils/win-utils.h',
                'src/utils/node_async_call.h',
                'src/utils/node_async_call.cc',
            ]);
        }

        files.forEach((value) => {
            this.fs.copy(
                this.templatePath(value),
                this.destinationPath(value)
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