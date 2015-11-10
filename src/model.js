import fetch from 'isomorphic-fetch';

export default class BaseModel {

  constructor( app, data = {} ) {

    // Expose a reference to the Kudu app. This is important because instances
    // have methods ('save' for example) that require access to e.g. a
    // configured serializer.
    this.app = app;

    // If an initial data object is provided to a model constructor the
    // properties of that object are mapped onto the resulting instance.
    Object.keys(data).forEach(( key ) => this[ key ] = data[ key ]);
  }

  // Send an unsaved model instance to the server as the body of an HTTP POST
  // request.
  save() {

    const endpoint = this.constructor.plural;
    let data = this.app.serialize.toJSON(this, {
      requireId: false,
    });

    return fetch(`${ this.app.baseURL }/${ endpoint }`, {
      method: 'post',
      body: data,
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(( res ) => res.json())
    .then(( json ) => this.app.deserialize(json, this.constructor.singular))
    .then(( result ) => {

      // Merge the object returned from the adapter with this model instance to
      // bring in any new properties added by the adapter (such as a generated
      // identifier).
      Object.keys(result).forEach(( key ) => this[ key ] = result[ key ]);

      return this;
    });
  }
}
