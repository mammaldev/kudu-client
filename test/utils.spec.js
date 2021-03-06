import chai from 'chai';
import { buildQueryString } from '../src/util';

const expect = chai.expect;

describe('Utilities', () => {

  describe('buildQueryString', () => {

    it('should return nothing if not passed anything', () => {
      expect(buildQueryString()).to.be.undefined;
    });

    it('should return an includes parameter if passed a single include', () => {
      expect(buildQueryString({ include: 'test' })).to.equal('?include=test');
    });

    it('should return an includes parameter if passed an array of includes', () => {
      expect(buildQueryString({ include: [ 'test', 'another' ] })).to.equal('?include=test,another');
    });
  });
});
