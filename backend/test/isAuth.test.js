const isAuth = require('../middleware/isAuth');
const sinon = require('sinon');
const expect = require('chai').expect;
const jwt = require('jsonwebtoken');

describe('[Middleware isAuth]', function () {
  it('should throw an error if no authorization header is present', function () {
    const req = {
      get: function (headerName) {
        return null;
      },
    };
    const nextSpy = sinon.spy();
    isAuth(req, {}, nextSpy);
    expect(nextSpy.calledOnce).to.be.true;
  });

  it('should throw an error if the authorization header is only one string', function () {
    const req = {
      get: function (headerName) {
        return 'xyz';
      },
    };
    const nextSpy = sinon.spy();
    isAuth(req, {}, nextSpy);
    expect(nextSpy.calledOnce).to.be.true;
  });

  it('should throw an error if the token cannot be verified', function () {
    const req = {
      get: function (headerName) {
        return 'Bearer' + 'xyz';
      },
    };
    const nextSpy = sinon.spy();
    isAuth(req, {}, nextSpy);
    expect(nextSpy.calledOnce).to.be.true;
  });

  it('should yield a userId after decoding the token', function () {
    const req = {
      get: function (headerName) {
        return 'Bearer' + 'abc';
      },
    };
    sinon.stub(jwt, 'verify');
    jwt.verify.returns({ userId: 'abc' });
    isAuth(req, {}, () => {});
    expect(req).to.have.property('userId');
    expect(req).to.have.property('userId', 'abc');
    expect(req).to.have.property('isAuth', true);
    expect(jwt.verify.called).to.be.true;
    jwt.verify.restore();
  });
});
