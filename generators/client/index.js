const Generator = require('yeoman-generator');

module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts);

        this.option('api', {
            type: Boolean,
            required: true,
            desc: 'include preload api'
        })
    }

    default () {
        if (this.options.api) {
            this.log('api is true')
        }
    }
};