import _ from 'lodash/fp';

export const loadConfigFromCLI = function (cliArguments) {
    return {
        paths: _.get('args', cliArguments)
    };
};