export default {

  // Build a query string to append to a URL when making a request.
  //
  // Options:
  //
  //   include    {String|Array}    A list of related resources to include in
  //                                the response.
  //
  buildQueryString( opts = {} ) {

    let qs;
    let includes;

    if ( opts.include ) {

      includes = Array.isArray(opts.include) ?
        opts.include.join() :
        opts.include;
    }

    if ( includes ) {
      qs = `?include=${ includes }`;
    }

    return qs;
  }
};
