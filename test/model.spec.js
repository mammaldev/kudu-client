import chai from 'chai';
import nock from 'nock';
import chaiAsPromised from 'chai-as-promised';
import Kudu from '../src/kudu';
import BaseModel from '../src/model';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('Model', () => {

  let kudu;

  beforeEach(() => {
    kudu = new Kudu({
      baseURL: 'http://localhost:7357',
    });
  });

  it('should expose the singular name on the constructor', () => {
    let Model = kudu.createModel('test', {});
    expect(Model).to.have.property('singular', 'test');
  });

  it('should expose the plural name on the constructor', () => {
    let Model = kudu.createModel('test', 'tests', {});
    expect(Model).to.have.property('plural', 'tests');
  });

  it('should default the plural name to singular name plus "s"', () => {
    let Model = kudu.createModel('test', {});
    expect(Model).to.have.property('plural', 'tests');
  });

  it('should expose the schema on the constructor', () => {
    let schema = {};
    let Model = kudu.createModel('test', schema);
    expect(Model.schema).to.equal(schema);
  });

  describe('instances', () => {

    let Model;

    beforeEach(() => {
      Model = kudu.createModel('test', {});
    });

    it('should inherit from the base Model constructor', () => {
      expect(new Model()).to.be.an.instanceOf(BaseModel);
    });

    it('should map provided data onto the instance', () => {
      expect(new Model({ id: 1 })).to.have.property('id', 1);
    });
  });

  describe('#save', () => {

    let Model;

    beforeEach(() => {
      Model = kudu.createModel('test', {
        properties: {
          name: {
            type: String,
            required: true,
          },
        },
      });
    });

    it('should return a promise', () => {
      let instance = new Model();
      expect(instance.save()).to.be.an.instanceOf(Promise);
    });

    it('should be rejected if the server returns an error', () => {
      let instance = new Model({ type: 'test' });
      nock('http://localhost:7357').post('/tests').reply(400, {
        errors: [
          { detail: 'test' },
        ],
      });
      return expect(instance.save()).to.be.rejectedWith(Error, /Expected an instance/);
    });

    it('should succeed when the model is valid', () => {
      let instance = new Model({ type: 'test', name: 'test' });
      nock('http://localhost:7357').post('/tests').reply(201, {
        data: { type: 'test', id: '1' },
      });
      return expect(instance.save()).to.eventually.be.an.instanceOf(Model)
        .and.have.property('id', '1');
    });

    it('should return the instance that was acted upon', () => {
      let instance = new Model({ type: 'test', name: 'test' });
      nock('http://localhost:7357').post('/tests').reply(201, {
        data: { type: 'test', id: '1' },
      });
      return expect(instance.save()).to.become(instance);
    });
  });
});