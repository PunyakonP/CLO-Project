"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.ResourceNotFoundError = exports.PermissionError = exports.AuthenticationError = exports.CustomError = exports.HttpClient = void 0;
var HttpClient_1 = require("./HttpClient");
Object.defineProperty(exports, "HttpClient", { enumerable: true, get: function () { return HttpClient_1.default; } });
var CustomError_1 = require("./errors/CustomError");
Object.defineProperty(exports, "CustomError", { enumerable: true, get: function () { return CustomError_1.default; } });
var AuthenticationError_1 = require("./errors/AuthenticationError");
Object.defineProperty(exports, "AuthenticationError", { enumerable: true, get: function () { return AuthenticationError_1.default; } });
var PermissionError_1 = require("./errors/PermissionError");
Object.defineProperty(exports, "PermissionError", { enumerable: true, get: function () { return PermissionError_1.default; } });
var ResourceNotFoundError_1 = require("./errors/ResourceNotFoundError");
Object.defineProperty(exports, "ResourceNotFoundError", { enumerable: true, get: function () { return ResourceNotFoundError_1.default; } });
var ValidationError_1 = require("./errors/ValidationError");
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return ValidationError_1.default; } });
//# sourceMappingURL=index.js.map