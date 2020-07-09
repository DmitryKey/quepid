'use strict';

describe('Service: Ratingsstoresvc', function () {

  // load the service's module
  beforeEach(module('QuepidTest'));

  var $httpBackend;
  // instantiate service
  var ratingsStoreSvc;
  beforeEach(inject(function ($injector, _ratingsStoreSvc_) {
    ratingsStoreSvc = _ratingsStoreSvc_;
    $httpBackend = $injector.get('$httpBackend');
  }));

  it('should convert ratings from strings to ints', function() {
    var ratingsStore = ratingsStoreSvc.createRatingsStore(0, 1, {doc1: '10'});
    expect(ratingsStore.getRating('doc1')).toBe(10);
  });

  it('should rate documents', function () {
    var ratingsStore = ratingsStoreSvc.createRatingsStore(0, 1, {});
    $httpBackend.expectPUT('/api/cases/0/queries/1/ratings/doc1').respond(200, {});
    ratingsStore.rateDocument('doc1', 10);
    $httpBackend.flush();
    expect(ratingsStore.getRating('doc1')).toBe(10);
    $httpBackend.verifyNoOutstandingExpectation();
  });

  it('should rate documents', function () {
    var ratingsStore = ratingsStoreSvc.createRatingsStore(0, 1, {});
    $httpBackend.expectPUT('/api/cases/0/queries/1/bulk/ratings').respond(200, {});

    ratingsStore.rateBulkDocuments(['doc1', 'doc2'], 10);
    $httpBackend.flush();

    expect(ratingsStore.getRating('doc1')).toBe(10);
    expect(ratingsStore.getRating('doc2')).toBe(10);

    $httpBackend.verifyNoOutstandingExpectation();
  });

  it('should urlencode when POSTIng rating', function() {
    var ratingsStore = ratingsStoreSvc.createRatingsStore(0, 1, {});
    $httpBackend.expectPUT('/api/cases/0/queries/1/ratings/ZmlsZTovL2Zvby9iYXI%3D').respond(200, {});
    ratingsStore.rateDocument('file://foo/bar', 10);
    $httpBackend.flush();
    expect(ratingsStore.getRating('file://foo/bar')).toBe(10);
    $httpBackend.verifyNoOutstandingExpectation();
  });
  it('should base 64 and urlencode when POSTIng rating w id is URL', function() {
    var ratingsStore = ratingsStoreSvc.createRatingsStore(0, 1, {});
    $httpBackend.expectPUT('/api/cases/0/queries/1/ratings/aHR0cDovL3d3dy5leGFtcGxlLmNvbS9kb2MvMQ%3D%3D').respond(200, {});
    ratingsStore.rateDocument('http://www.example.com/doc/1', 10);
    $httpBackend.flush();
    expect(ratingsStore.getRating('http://www.example.com/doc/1')).toBe(10);

    var id = 'aspace-https-archives-yale-edu-repositories-5-archival_objects-2530795';
    $httpBackend.expectPUT('/api/cases/0/queries/1/ratings/aspace-https-archives-yale-edu-repositories-5-archival_objects-2530795').respond(200, {});
    ratingsStore.rateDocument('aspace-https-archives-yale-edu-repositories-5-archival_objects-2530795', 10);
    $httpBackend.flush();
    expect(ratingsStore.getRating('aspace-https-archives-yale-edu-repositories-5-archival_objects-2530795')).toBe(10);

    // Base64 encoded value of d2Vic2l0ZTpodHRwOi8vd3d3Lmdvb2dsZS5jb20= is then URL encoded.
    id = 'website:http://www.google.com';
    $httpBackend.expectPUT('/api/cases/0/queries/1/ratings/d2Vic2l0ZTpodHRwOi8vd3d3Lmdvb2dsZS5jb20%3D').respond(200, {});
    ratingsStore.rateDocument('website:http://www.google.com', 10);
    $httpBackend.flush();
    expect(ratingsStore.getRating('website:http://www.google.com')).toBe(10);

    $httpBackend.verifyNoOutstandingExpectation();
  });
  it('should base 64 and urlencode when POSTIng rating w id containing a period', function() {
    var ratingsStore = ratingsStoreSvc.createRatingsStore(0, 1, {});
    $httpBackend.expectPUT('/api/cases/0/queries/1/ratings/bXlkb2MucGRm').respond(200, {});
    ratingsStore.rateDocument('mydoc.pdf', 10);
    $httpBackend.flush();
    expect(ratingsStore.getRating('mydoc.pdf')).toBe(10);
    $httpBackend.verifyNoOutstandingExpectation();
  });

  it('should urlencode when DELETING rating', function() {
    var ratingsStore = ratingsStoreSvc.createRatingsStore(0, 1, {});
    $httpBackend.expectDELETE('/api/cases/0/queries/1/ratings/ZmlsZTovL2Zvby9iYXI%3D').respond(200, {});
    ratingsStore.resetRating('file://foo/bar');
    $httpBackend.flush();
    expect(ratingsStore.hasRating('file://foo/bar')).toBe(false);
    $httpBackend.verifyNoOutstandingExpectation();
  });

  it('should alter the value of existing ratings', function() {
    var ratingsStore = ratingsStoreSvc.createRatingsStore(0, 1, {doc1: 10});
    $httpBackend.expectPUT('/api/cases/0/queries/1/ratings/doc1').respond(200, {});
    ratingsStore.rateDocument('doc1', 5);
    $httpBackend.flush();
    expect(ratingsStore.getRating('doc1')).toBe(5);
    $httpBackend.verifyNoOutstandingExpectation();
  });

  it('should reset ratings', function() {
    var ratingsStore = ratingsStoreSvc.createRatingsStore(0, 1, {doc1: 10});
    expect(ratingsStore.hasRating('doc1')).toBeTruthy();
    $httpBackend.expectDELETE('/api/cases/0/queries/1/ratings/doc1').respond(200, {});
    ratingsStore.resetRating('doc1');
    $httpBackend.flush();
    expect(ratingsStore.hasRating()).toBe(false);
    $httpBackend.verifyNoOutstandingExpectation();
  });

  it('should reset bulk ratings', function() {
    var ratingsStore = ratingsStoreSvc.createRatingsStore(0, 1, { doc1: 10, doc2: 10 });

    expect(ratingsStore.hasRating('doc1')).toBeTruthy();

    $httpBackend.expectPOST('/api/cases/0/queries/1/bulk/ratings/delete').respond(200, {});

    ratingsStore.resetBulkRatings(['doc1', 'doc2']);

    $httpBackend.flush();

    expect(ratingsStore.hasRating()).toBe(false);

    $httpBackend.verifyNoOutstandingExpectation();
  });

  it('should create rateable docs that inherit from querydoc', function() {
    var ratingsStore = ratingsStoreSvc.createRatingsStore(0, 1, {doc1: 10});
    var flarb = null;
    var flarbQuery = {id: 1, dotheflarb: function() {flarb = 2;}};
    var rateableFlarbQuery = ratingsStore.createRateableDoc(flarbQuery);
    rateableFlarbQuery.dotheflarb();
    expect(flarb).toBe(2);

    var flarbQuery2 = {id: 1, dotheflarb2: function() {flarb = 4;}};
    var rateableFlarbQuery2 = ratingsStore.createRateableDoc(flarbQuery2);
    rateableFlarbQuery2.dotheflarb2();
    expect(flarb).toBe(4);
    rateableFlarbQuery.dotheflarb();
    expect(flarb).toBe(2);

  });

  it('updates version increment on reset', function() {
    var ratingsStore = ratingsStoreSvc.createRatingsStore(0, 1, {doc1: 10});
    $httpBackend.expectDELETE('/api/cases/0/queries/1/ratings/doc1').respond(200, {});
    var origVersion = ratingsStore.version();
    ratingsStore.resetRating('doc1');
    $httpBackend.flush();
    expect(ratingsStore.version()).not.toEqual(origVersion);
  });

  it('updates version increment on rate', function() {
    var ratingsStore = ratingsStoreSvc.createRatingsStore(0, 1, {doc1: 10});
    $httpBackend.expectPUT('/api/cases/0/queries/1/ratings/doc1').respond(200, {});
    var origVersion = ratingsStore.version();
    ratingsStore.rateDocument('doc1', '5');
    $httpBackend.flush();
    expect(ratingsStore.version()).not.toEqual(origVersion);
  });

  it('returns the best docs', function() {
    var ratingsStore = ratingsStoreSvc.createRatingsStore(0, 1,
      {
        'doc2': 9,
        'doc1': 10,
        'doc3': 8,
      }
      );
    var bestDocs = ratingsStore.bestDocs(2);
    expect(bestDocs[0].id).toEqual('doc1');
    expect(bestDocs[1].id).toEqual('doc2');

    bestDocs = ratingsStore.bestDocs(10);
    expect(bestDocs[0].id).toEqual('doc1');
    expect(bestDocs[1].id).toEqual('doc2');
    expect(bestDocs[2].id).toEqual('doc3');
  });

});

describe('Rateable Docs', function () {
  beforeEach(module('QuepidTest'));

  var $httpBackend;
  // instantiate service
  var ratingsStoreSvc;
  beforeEach(inject(function ($injector, _ratingsStoreSvc_) {
    ratingsStoreSvc = _ratingsStoreSvc_;
    $httpBackend = $injector.get('$httpBackend');
  }));

  it('posts on rate', function() {
    var ratingsStore = ratingsStoreSvc.createRatingsStore(0, 1, {doc1: 10});
    var solrDoc = {'id': 'doc2'};
    var rateableSolrDoc = ratingsStore.createRateableDoc(solrDoc);
    $httpBackend.expectPUT('/api/cases/0/queries/1/ratings/doc2').respond(200, {});
    rateableSolrDoc.rate(5);
    $httpBackend.flush();
    expect(rateableSolrDoc.getRating()).toBe(5);
    $httpBackend.verifyNoOutstandingExpectation();
  });

  it('deletes ratings', function() {
    var ratingsStore = ratingsStoreSvc.createRatingsStore(0, 1, {doc1: 10});
    var solrDoc = {'id': 'doc2'};
    var rateableSolrDoc = ratingsStore.createRateableDoc(solrDoc);
    $httpBackend.expectDELETE('/api/cases/0/queries/1/ratings/doc2').respond(200, {});
    rateableSolrDoc.resetRating();
    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingExpectation();
  });

  it('has no rating initially', function() {
    var ratingsStore = ratingsStoreSvc.createRatingsStore(0, 1, {doc1: 10});
    var solrDoc = {'id': 'doc2'};
    var rateableSolrDoc = ratingsStore.createRateableDoc(solrDoc);
    expect(rateableSolrDoc.hasRating()).toBe(false);
    expect(rateableSolrDoc.getRating()).toBe(null);
  });
});
