'use strict';
var expect = require('chai').expect;
var impose = require('..');
var suite = {};

function isUserFunction(object) {
    var result;
    //noinspection JSAccessibilityCheck
    result = (
    ('function' == typeof object) &&
    '[object Function]' == Object.prototype.toString.call(object)
    );
    return result;
}

function isUserObject(object) {
    var result;
    //noinspection JSAccessibilityCheck
    result = (
    ('object' == typeof object) &&
    '[object Object]' == Object.prototype.toString.call(object)
    );
    return result;
}

function foo() {
    return 'foo';
}

suite.returnValue = function () {
    it('an object if no constructor property is provided',
        function () {
            var composition;
            composition = impose({
                provide: {
                    foo: foo
                }
            });
            expect(isUserObject(composition)).to.be.equal(true);
        });

    it('a constructor function if a constructor property is provided',
        function () {
            var Composition;
            var instance;
            Composition = impose({
                provide: {
                    constructor: function () {

                    },
                    foo: function () {

                    }
                }
            });
            expect(isUserFunction(Composition)).to.be.equal(true);
            instance = new Composition();
            expect(isUserFunction(instance.foo)).to.be.equal(true);
            expect(instance.hasOwnProperty('foo')).to.be.equal(false);
        });
};

suite.interfaceHandler = function () {
    it('with a provided function', function () {
        var composition = impose({
            implement: ['foo'],
            provide: {
                foo: foo
            }
        });
        expect(composition.foo()).to.be.equal('foo');
    });

    it('by using an object',
        function () {
            var
                host,
                composition;
            host = {
                foo: foo
            };
            composition = impose({
                implement: ['foo'],
                use: [host]
            });
            expect(composition.foo()).to.be.equal('foo');
        });

    it('by using a constructor',
        function () {
            var composition;

            function Host() {
            }

            //noinspection JSAccessibilityCheck
            Host.prototype.foo = foo;

            composition = impose({
                implement: ['foo'],
                use: [Host]
            });
            expect(composition.foo()).to.be.equal('foo');
        });
};

suite.implementationHandler = function () {
    it('with objects', function () {
        var
            foo,
            bar,
            composition;
        foo = {
            baz: function () {
                return 'foo baz';
            }
        };
        bar = {
            baz: function () {
                return 'bar baz';
            }
        };
        composition = impose({
            implement: ['baz'],
            use: [foo, bar],
            resolve: {
                'baz': foo
            }
        });
        expect(composition.baz()).to.be.equal('foo baz');
    });

    it('with constructors',
        function () {
            var
                bar,
                composition;

            function Foo() {
            }

            //noinspection JSAccessibilityCheck
            Foo.prototype.baz = function () {
                return 'Foo baz';
            };

            bar = {
                baz: function () {
                    return 'bar baz';
                }
            };
            composition = impose({
                implement: ['baz'],
                use: [Foo, bar],
                resolve: {
                    'baz': Foo
                }
            });
            expect(composition.baz()).to.be.equal('Foo baz');
        });
};

suite.errorHandler = function () {
    it('an interface method is not implemented', function () {
        var message = 'Interface method not implemented: foo';
        var exceptionMessage;

        try {
            impose({
                implement: ['foo']
            });
        } catch (exception) {
            exceptionMessage = exception.message;
        }

        expect(exceptionMessage).to.be.equal(message);
    });

    it('an interface property is not resolved to a user function',
        function () {
            var message = 'Not a function: foo';
            var exceptionMessage;

            try {
                impose({
                    implement: ['foo'],
                    use: [
                        {
                            foo: 42
                        }
                    ]
                });
            } catch (exception) {
                exceptionMessage = exception.message;
            }

            expect(exceptionMessage).to.be.equal(message);
        });

    it('multiple implementations are not resolved',
        function () {
            var message = 'conflict: baz';
            var foo;
            var bar;
            var exceptionMessage;

            foo = {
                baz: function () {
                    return 'foo baz';
                }
            };
            bar = {
                baz: function () {
                    return 'bar baz';
                }
            };

            try {
                impose({
                    implement: ['baz'],
                    use: [foo, bar]
                });
            } catch (exception) {
                exceptionMessage = exception.message;
            }

            expect(exceptionMessage).to.be.equal(message);
        });

    it('a resolved method is provided',
        function () {
            var message = 'Resolved method conflicts with provided method: baz';
            var exceptionMessage;
            var foo;
            var bar;

            foo = {
                baz: function () {
                    return 'foo baz';
                }
            };
            bar = {
                baz: function () {
                    return 'bar baz';
                }
            };

            try {
                impose({
                    implement: ['baz'],
                    use: [foo, bar],
                    resolve: {
                        'baz': foo
                    },
                    provide: {
                        'baz': function () {
                            return 'quux';
                        }
                    }
                });
            } catch (exception) {
                exceptionMessage = exception.message;
            }

            expect(exceptionMessage).to.be.equal(message);
        });

    it('a resolver property does not reference an object or a function',
        function () {
            var message = 'Could not resolve the host for `baz` to an object or function';
            var exceptionMessage;

            try {
                impose({
                    implement: ['baz'],
                    use: [
                        {
                            baz: function () {
                            }
                        },
                        {
                            baz: function () {
                            }
                        }
                    ],
                    resolve: {
                        'baz': null
                    }
                });
            } catch (exception) {
                exceptionMessage = exception.message;
                expect(exceptionMessage).to.be.equal(message);
            }
        });

    it('a resolver property does not reference a host property',
        function () {
            var message = 'Could not resolve method baz in the host';
            var exceptionMessage;
            var foo = {};
            var bar = {};

            try {
                impose({
                    implement: ['baz'],
                    use: [foo, bar],
                    resolve: {
                        'baz': foo
                    }
                });
            } catch (exception) {
                exceptionMessage = exception.message;
                expect(exceptionMessage).to.be.equal(message);
            }
        });
};

describe('The `impose` function',
    function () {
        it('is a user function',
            function () {
                expect(isUserFunction(impose)).to.be.equal(true);
            });
        describe('returns', suite.returnValue);
        describe('can implement an interface method', suite.interfaceHandler);
        describe('resolves multiple implementations', suite.implementationHandler);
        describe('throws an error if', suite.errorHandler);
    });
