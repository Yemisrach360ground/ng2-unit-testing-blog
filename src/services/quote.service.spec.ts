import { provide } from 'angular2/core';
import {
  ResponseOptions,
  Response,
  Http,
  BaseRequestOptions,
  RequestMethod
} from 'angular2/http';

import {
  describe, 
  expect, 
  it,
  inject,
  fakeAsync,
  beforeEachProviders
} from 'angular2/testing';

import { MockBackend, MockConnection } from 'angular2/http/testing';
import { QuoteService, IQuote, IAPIRecord } from './quote.service';
import { RandomNumberService } from './random-number.service';

class StubRandomNumberService {
  pick: (min: number, max: number) => number;
}

const mockHttpProvider = {
  deps: [ MockBackend, BaseRequestOptions ],
  useFactory: (backend: MockBackend, defaultOptions: BaseRequestOptions) => {
    return new Http(backend, defaultOptions);
  }
}

describe('QuoteService', () => {

  beforeEachProviders(() => {
    return [
      QuoteService,
      provide(RandomNumberService, {useClass: StubRandomNumberService}),
      provide('QUOTE_DATA', { useValue: [ {
        text: 'Testing is a good thing',
        attribution: 'Me'
      }]}),
      MockBackend,
      BaseRequestOptions,
      provide(Http, mockHttpProvider)
    ];
  });

  it('should use RandomNumberService to choose a quote',
  inject(
    [QuoteService, RandomNumberService],
    (quoteService: QuoteService,
    stubRandomNumberService: RandomNumberService) => {

    stubRandomNumberService.pick = jasmine.createSpy(
      'pick').and.returnValue(0);

    quoteService.getRandomQuote();
    expect(stubRandomNumberService.pick).toHaveBeenCalledWith(0, 1);
  }));

  it('should use an HTTP call to obtain a remote quote', 
    inject(
      [QuoteService, MockBackend],
      fakeAsync((service: QuoteService, backend: MockBackend) => {
        backend.connections.subscribe((connection: MockConnection) => {

          expect(connection.request.method).toBe(RequestMethod.Get);
          expect(connection.request.url).toBe(
            'http://quotesondesign.com/wp-json/posts?filter[orderby]=rand');
        });

        service.getRemoteQuote();
      })));

  it('should parse the remote quote server response correctly', inject(
    [QuoteService, MockBackend],
    fakeAsync((service: QuoteService, backend: MockBackend) => {
      backend.connections.subscribe((connection: MockConnection) => {

        let mockResponseBody: IAPIRecord[] = [{
          title: 'Me',
          content: 'Testing is a good thing'
        }];

        let response = new ResponseOptions({body: JSON.stringify(mockResponseBody)});
        connection.mockRespond(new Response(response));
      });

      const parsedQuote$ = service.getRemoteQuote()
        .subscribe(quote => {
          expect(quote.text).toEqual('Testing is a good thing');
          expect(quote.attribution).toEqual('Me');
        });
    })));
});
