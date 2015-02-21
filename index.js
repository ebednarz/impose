'use strict';

/**
 *
 * @param {Array} input
 * @param {Object} map
 * @returns {Array}
 */
function getFlattenedInterface(input, map) {
    var interfaceMethods = [];
    var length = input.length;
    var item;

    while (length--) {
        item = input[length];

        // items are either strings or arrays
        if ('string' == typeof item) {
            if (map.hasOwnProperty(item)) {
                throw new Error('Duplicate interface method: ' + item);
            }

            interfaceMethods[(map[item] = interfaceMethods.length)] = item;
        } else {
            interfaceMethods = interfaceMethods.concat(
                getFlattenedInterface(item, map)
            );
        }
    }

    return interfaceMethods;
}

function resolve(resolver, composition) {
    var resolverMethod;
    var resolverItem;

    for (resolverMethod in resolver) {
        if (resolver.hasOwnProperty(resolverMethod)) {
            if (composition.hasOwnProperty(resolverMethod)) {
                throw new Error(
                    'Resolved method conflicts with provided method: ' +
                    resolverMethod
                );
            }

            if ('function' == typeof resolver[resolverMethod]) {
                resolverItem = resolver[resolverMethod].prototype;
            } else if (
                ('object' == typeof resolver[resolverMethod]) &&
                resolver[resolverMethod]
            ) {
                resolverItem = resolver[resolverMethod];
            } else {
                throw new Error([
                    'Could not resolve the host for `',
                    resolverMethod,
                    '` to an object or function'
                ].join(''));
            }

            if (!resolverItem.hasOwnProperty(resolverMethod)) {
                throw new Error([
                    'Could not resolve method',
                    resolverMethod,
                    'in the host'
                ].join(' '));
            }

            composition[resolverMethod] = resolverItem[resolverMethod];
        }
    }
}

function getItem(hostItem, interfaceMethod, candidate) {
    switch (typeof hostItem) {
    case 'object':
        if (hostItem.hasOwnProperty(interfaceMethod)) {
            if (null !== candidate) {
                throw new Error('conflict: ' + interfaceMethod);
            }

            candidate = hostItem[interfaceMethod];
        }
        break;
    case 'function':
        if (hostItem.prototype.hasOwnProperty(interfaceMethod)) {
            if (null !== candidate) {
                throw new Error('conflict: ' + interfaceMethod);
            }

            candidate = hostItem.prototype[interfaceMethod];
        }
        break;
    }

    return candidate;
}

function getCandidate(host, interfaceMethod) {
    var candidate = null;
    var hostLength;

    if (host) {
        hostLength = host.length;

        while (hostLength--) {
            candidate = getItem(
                host[hostLength],
                interfaceMethod,
                candidate
            );
        }
    }

    if (null === candidate) {
        throw new Error(
            'Interface method not implemented: ' + interfaceMethod
        );
    } else if ('function' != typeof candidate) {
        throw new TypeError('Not a function: ' + interfaceMethod);
    }

    return candidate;
}

/**
 *
 * @param {Object} configuration
 * @param {Array}  [configuration.implement]
 * @param {Array}  [configuration.use]
 * @param {Object} [configuration.provide]
 * @param {Object} [configuration.resolve]
 * @returns {Function|Object}
 */
function impose(configuration) {
    var composition = {};
    var interfaceList;
    var interfaceLength;
    var interfaceMethod;
    var host;
    var provider;
    var providerMethod;

    if (configuration.hasOwnProperty('provide')) {
        provider = configuration.provide;

        for (providerMethod in provider) {
            if (provider.hasOwnProperty(providerMethod)) {
                composition[providerMethod] = provider[providerMethod];
            }
        }
    }

    if (configuration.hasOwnProperty('resolve')) {
        resolve(configuration.resolve, composition);
    }

    if (configuration.hasOwnProperty('implement')) {
        interfaceList = getFlattenedInterface(configuration.implement, {});
        interfaceLength = interfaceList.length;

        if (configuration.hasOwnProperty('use')) {
            host = configuration.use;
        }

        while (interfaceLength--) {
            interfaceMethod = interfaceList[interfaceLength];
            if (!composition.hasOwnProperty(interfaceMethod)) {
                composition[interfaceMethod] = getCandidate(
                    host,
                    interfaceMethod
                );
            }
        }
    }

    if (provider && provider.hasOwnProperty('constructor')) {
        provider.constructor.prototype = composition;
        return provider.constructor;
    }

    return composition;
}

module.exports = impose;
