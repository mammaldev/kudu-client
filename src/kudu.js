import addStaticInherits from 'kudu-model-inherits-decorator';
import deserialize from 'kudu-deserializer-jsonapi';
import serialize from 'kudu-serializer-jsonapi';
import fetch from 'isomorphic-fetch';
import BaseModel from './model';
import { buildQueryString } from './util';

export default class Kudu {

  constructor( { baseURL = '', request = fetch } = {} ) {

    // Create the model store. All models created for this app will be
    // referenced from this object. Since models have both a singular and
    // plural name we have two stores, each keyed by one form.
    this.models = new Map();
    this.modelsByPluralName = new Map();

    // Store a reference to the base URL. This is prepended to any request to
    // the server. A common example would be "/api".
    this.baseURL = baseURL;

    // Store a reference to the "request" method. This defaults to "fetch" as
    // provided by the isomorphic-fetch module. In supporting browsers this
    // should be the native function. Configuring this here makes it easy to
    // provide a mock fetch in tests.
    this.request = request;

    // Create a serializer and deserializer for this app. The defaults expect
    // to handle data in a format that complies with the JSON API spec. In the
    // future this will become configurable to allow other formats.
    this.deserialize = deserialize.bind(null, this);
    this.serialize = serialize;
  }

  // Create a new model. The result will be a constructor function that can
  // produce model instances and interact with stored instances via static
  // methods.
  //
  // Arguments:
  //
  //   singular    {String}    The name of the model in singular form.
  //
  //   [plural]    {String}    The name of the model in plural form. Defaults
  //                           to the singular name with an appended 's'.
  //
  //   schema      {Object}    The fields available to instances of this model
  //                           plus the constraints applied to those fields, as
  //                           well as any relationships to other models.
  //
  createModel( singular, plural, schema ) {

    // Plural name is optional. If it isn't provided the second argument should
    // be the schema object.
    if ( typeof plural === 'object' ) {
      schema = plural;
      plural = `${ singular }s`;
    }

    if ( typeof schema !== 'object' ) {
      throw new Error('No schema provided.');
    }

    // If the schema does not define any relationships we add an empty object so
    // other plugins don't have to worry about whether or not the key will exist
    // on the schema.
    if ( !schema.relationships ) {
      schema.relationships = Object.create(null);
    }

    const kudu = this;

    @addStaticInherits
    class Model extends BaseModel {

      static singular = singular
      static plural = plural
      static schema = schema

      // Find a specific stored instance of this model by unique identifier.
      static get( id, opts = {} ) {

        const qs = buildQueryString(opts);
        let url = `${ kudu.baseURL }/${ plural }/${ id }`;
        if ( qs ) {
          url += qs;
        }

        return fetch(url, {
          method: 'get',
          credentials: 'same-origin',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        })
        .then(( res ) => res.json())
        .then(( json ) => kudu.deserialize(json, singular));
      }

      // Find all stored instances of this model.
      static getAll( opts = {} ) {

        const qs = buildQueryString(opts);
        let url = `${ kudu.baseURL }/${ plural }`;
        if ( qs ) {
          url += qs;
        }

        return fetch(url, {
          method: 'get',
          credentials: 'same-origin',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        })
        .then(( res ) => res.json())
        .then(( json ) => kudu.deserialize(json, singular));
      }

      constructor( data ) {
        super(kudu, data);
      }
    }

    // Add the new model to the model cache.
    this.models.set(singular, Model);
    this.modelsByPluralName.set(plural, Model);

    return Model;
  }

  // Get a model constructor previously created with Kudu#createModel.
  //
  // Arguments:
  //
  //   singular    {String}    The name of the model in singular form.
  //
  getModel( singular ) {
    return this.models.get(singular);
  }
}
