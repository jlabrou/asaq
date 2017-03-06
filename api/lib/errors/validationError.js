(function () {
    'use strict';
    
    var validationError = function (status, errors) {
        
        var err_list = [];
        
        if (errors) {
            for (var key in Object.keys(errors)) {
                var ex = errors[Object.keys(errors)[key]];
                err_list.push({
                    'field': ex.path,
                    'message': ex.message
                });
            }
        }
        validationError.super_.call(this, status, { validation: err_list });
    };
    
    module.exports = validationError;
    require('util').inherits(module.exports, require('./customError'));
})()