import chai from 'chai';
import Kudu from '../src/kudu';

const expect = chai.expect;

describe('Kudu', () => {

  let kudu;

  beforeEach(() => {
    kudu = new Kudu();
  });

  it('should expose a constructor function', () => {
    expect(Kudu).to.be.a('function');
  });

  it('should expose a serializer', () => {
    expect(kudu.serialize).to.be.an('object');
  });

  it('should expose a configured base URL', () => {
    expect(new Kudu({ baseURL: '/api' }).baseURL).to.equal('/api');
  });

  it('should default the base URL to the empty string', () => {
    expect(kudu.baseURL).to.equal('');
  });

  describe('#createModel', () => {

    it('should throw an error if not passed a schema object', () => {
      let test = () => kudu.createModel('test');
      expect(test).to.throw(Error, /schema/);
    });

    it('should return a constructor when passed valid arguments', () => {
      expect(kudu.createModel('test', {})).to.be.a('function');
    });

    it('should not treat a plural name as a schema', () => {
      expect(kudu.createModel('test', 'tests', {})).to.be.a('function');
    });

    it('should add the model to the model cache', () => {
      let Model = kudu.createModel('test', {});
      expect(kudu.models.get('test')).to.equal(Model);
    });

    it('should add the model to the pluralised model cache', () => {
      let Model = kudu.createModel('test', {});
      expect(kudu.modelsByPluralName.get('tests')).to.equal(Model);
    });
  });

  describe('#createModels', () => {

    it('should throw an error if not passed anything', () => {
      let test = () => kudu.createModels();
      expect(test).to.throw(Error, /data object/);
    });

    it('should return a model instance if passed a single data object', () => {
      let Model = kudu.createModel('test', {});
      expect(kudu.createModels({ type: 'test' })).to.be.an.instanceOf(Model);
    });

    it('should return an array of model instances if passed an array', () => {
      let Model = kudu.createModel('test', {});
      expect(kudu.createModels([ { type: 'test' } ])[ 0 ]).to.be.an.instanceOf(Model);
    });

    it('should return the data object if it doesn\'t correspond to a model', () => {
      let data = {};
      expect(kudu.createModels(data)).to.equal(data);
    });
  });

  describe('#getModel', () => {

    it('should return a model constructor from the model cache', () => {
      let Model = kudu.createModel('test', {});
      expect(kudu.getModel('test')).to.equal(Model);
    });

    it('should return undefined when no model matches the given name', () => {
      expect(kudu.getModel('fail')).to.be.undefined;
    });
  });
});
