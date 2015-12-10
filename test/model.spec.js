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

  it('should default "relationships" to an empty object on the schema', () => {
    let schema = {};
    let Model = kudu.createModel('test', schema);
    expect(Model.schema.relationships).to.deep.equal({});
  });

  it('should decorate the constructor with a static "inherits" method', () => {
    let Model = kudu.createModel('test', {});
    expect(Model.inherits).to.be.a('function');
  });

  describe('static get', () => {

    let Model;

    beforeEach(() => {
      Model = kudu.createModel('test', {});
    });

    it('should return a promise', () => {
      expect(Model.get('1')).to.be.an.instanceOf(Promise);
    });

    it('should be rejected if the server returns an error', () => {
      nock('http://localhost:7357').get('/tests/1').reply(500, {
        errors: [
          { detail: 'test' },
        ],
      });
      return expect(Model.get('1')).to.be.rejectedWith(Error, /Expected an instance/);
    });

    it('should return an instance', () => {
      nock('http://localhost:7357').get('/tests/1').reply(200, {
        data: { type: 'test', id: '1' },
      });
      return expect(Model.get('1')).to.eventually.be.an.instanceOf(BaseModel);
    });
  });

  describe('static getAll', () => {

    let Model;

    beforeEach(() => {
      Model = kudu.createModel('test', {});
    });

    it('should return a promise', () => {
      expect(Model.getAll()).to.be.an.instanceOf(Promise);
    });

    it('should be rejected if the server returns an error', () => {
      nock('http://localhost:7357').get('/tests').reply(500, {
        errors: [
          { detail: 'test' },
        ],
      });
      return expect(Model.getAll()).to.be.rejectedWith(Error, /Expected an instance/);
    });

    it('should return an array of instances', () => {
      nock('http://localhost:7357').get('/tests').reply(200, {
        data: [
          { type: 'test', id: '1' },
          { type: 'test', id: '2' },
        ],
      });
      return expect(Model.getAll()).to.eventually.be.an('array').of.length(2);
    });

    it('should ask for included documents if the relevant option is present', () => {
      nock('http://localhost:7357')
      .get('/tests')
      .query({ include: 'relation' })
      .reply(200, {
        data: [
          { type: 'test', id: '1' },
        ],
      });
      return expect(Model.getAll({ include: 'relation' })).to.eventually.be.an('array');
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

    it('should ask for included documents if the relevant option is present', () => {
      let instance = new Model({ type: 'test', name: 'test' });
      nock('http://localhost:7357')
      .post('/tests')
      .query({ include: 'relation' })
      .reply(201, {
        data: { type: 'test', id: '1' },
      });
      return expect(instance.save({ include: 'relation' })).to.become(instance);
    });
  });

  describe('#update', () => {

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
      let instance = new Model({ type: 'test', id: '1' });
      nock('http://localhost:7357').put('/tests/1').reply(400, {
        errors: [
          { detail: 'test' },
        ],
      });
      return expect(instance.update()).to.be.rejectedWith(Error, /Expected an instance/);
    });

    it('should succeed when the model is valid', () => {
      let instance = new Model({ type: 'test', id: '1', name: 'test' });
      nock('http://localhost:7357').put('/tests/1').reply(201, {
        data: { type: 'test', id: '1' },
      });
      return expect(instance.update()).to.eventually.be.an.instanceOf(Model)
        .and.have.property('id', '1');
    });

    it('should return the instance that was acted upon', () => {
      let instance = new Model({ type: 'test', id: '1', name: 'test' });
      nock('http://localhost:7357').put('/tests/1').reply(201, {
        data: { type: 'test', id: '1' },
      });
      return expect(instance.update()).to.become(instance);
    });

    it('should ask for included documents if the relevant option is present', () => {
      let instance = new Model({ type: 'test', id: '1', name: 'test' });
      nock('http://localhost:7357')
      .put('/tests/1')
      .query({ include: 'relation' })
      .reply(201, {
        data: { type: 'test', id: '1' },
      });
      return expect(instance.update({ include: 'relation' })).to.become(instance);
    });
  });
});
