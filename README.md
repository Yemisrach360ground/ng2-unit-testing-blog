# Testing Your Angular 2 Application

__Part 2 of 2: Testing Services__

## Where we left off

[In part 1 of this series](http://blog.rangle.io/testing-angular-2-applications/)
we defined a `QuoteComponent` that displays a random quote on a
web page. Here it is again:

```TypeScript
import { IQuote, QuoteService } from '../services/quote.service';
import { Component } from 'angular2/core';

@Component({
    selector: 'my-quote',
    providers: [ QuoteService ],
    template: `
        <h3>Random Quote</h3>
        <blockquote>{{ quote.text }}</blockquote>
        <p>- {{ quote.attribution }}</p>
        <button (click)=getQuote()>Get a new quote</button>
    `
})
export class QuoteComponent {
  quote: IQuote;

  constructor (private quoteService: QuoteService){
    this.getQuote();
  }

  getQuote() {
    this.quote = this.quoteService.getQuote();
  }
}
```

We showed how to use Angular2's testing utilities to mock out `QuoteService` and
test the `QuoteComponent`'s presentation logic in isolation.

In this post, I'll do the opposite: I'll isolate the `QuoteService` and show
how to unit test the code at your application's service level.

## Testing QuoteService

Consider the following implementation of `QuoteService`:

```TypeScript
import { Injectable, Inject } from 'angular2/core';
import { quotes } from './quote.data';
import { RandomNumberService } from './random-number.service';

export type IQuote = {
  text: string,
  attribution: string
};

@Injectable()
export class QuoteService {
  constructor(
    private randomNumberService: RandomNumberService,
    @Inject('QUOTE_DATA') private allQuotes: IQuote[]) {}

  getQuote() {
    const index = this.randomNumberService.pick(
      0,
      this.allQuotes.length);
    return this.allQuotes[index];
  }
};
```

This service uses a random number generator to pick a quote at random from a
hard-coded list in `quote.data.ts`:

```TypeScript
export const quotes = [
  {
  text: 'Talk is cheap. Show me the code.',
  attribution: 'Linus Torvalds'
  },
  // ...
```

How would we get this under test?

### Angular2 Testing Tools

First, we can access the tools provided by the `angular2/testing` package:

```TypeScript
import {
  describe,
  it,
  inject,
  beforeEachProviders,
  expect
} from 'angular2/testing';
```

In effect, Angular2 gives us a modified version of the excellent [jasmine](http://jasmine.github.io/)
testing framework.

You should remember these tools from part 1 of this series, but briefly:
* `describe`: the `describe` function creates a set of related tests.
* `it`: the `it` function defines a particular unit test.
* `inject` allows you to invoke Angular2's dependency injector to instantiate
the services being used.
* `beforeEachProviders` allows you to override the dependency injector to supply
stubs or mocks for the parts of the system you're not explicitly testing right
now.
* `expect` allows us to check that conditions have been met, throwing errors if they have not been.

### Isolate the Unit under Test

Next, we need to isolate the unit under test (in this case `QuoteService`).
We'll do this by replacing `RandomNumberService` and `QUOTE_DATA` with stubs or
mocks.

Once again, we use our old friends `provide` and `beforeEachProviders` to do
this:

```TypeScript
class StubRandomNumberService {
  pick: (min: number, max: number) => number;
}

beforeEachProviders(() => [
  QuoteService,
  provide(RandomNumberService, {useClass: StubRandomNumberService}),
  provide('QUOTE_DATA', { useValue: [ {
    text: 'Testing is a good thing',
    attribution: 'Me'
  }]})
]);
```

Since `QUOTE_DATA` is just a list of hard-coded records, we can replace it with
some data that's tailored to the behaviour we want to test. This is done using
`provide`'s `useValue` option: whenever Angular2's dependency injector is
asked for `QUOTE_DATA`, it will use our test data instead.

The `RandomNumberService`, on the other hand, can be stubbed out with an empty class that we'll manipulate later. Think of this as partial typings for the bits of `RandomNumberService`
that we care about in this test.

Unlike a mock, a stub does not result in in complex mocking logic being shared
across different test suites; we'll leave it up to each specific test to supply
the relevant implementation of this simple service.

> Whether to use a stub or a mock is largely a matter of taste; I tend to
prefer stubs where possible because they decouple tests from each other and are
in many cases easier to reason about.

### Set up an Actual Test

Now that we've set up our test environment, we can write an actual test.

```TypeScript
it('should use RandomNumberService to choose a quote',
  inject(
    [QuoteService, RandomNumberService],
    (quoteService: QuoteService,
    stubRandomNumberService: RandomNumberService) => {

    // Specify the stub behaviour for this test.
    stubRandomNumberService.pick = jasmine.createSpy(
      'pick').and.returnValue(0);

    // Exercise the function under test.
    quoteService.getQuote();

    // Verify expectations.
    expect(stubRandomNumberService.pick).toHaveBeenCalledWith(0, 1);
  }));
```

This is a classic example of stub-based unit testing: I'm beginning with an
empty stub for RandomNumberService and swapping in the minimum implementation
for a meaningful test.  This way I don't have to maintain a complex mock object
in addition to the real one.

I verify behaviour using Jasmine's `createSpy`, which creates an instrumented, fake implementation of the `pick`
method.

I personally find that this is a very clean, readable, and flexible testing style.

### Putting it all Together

```typescript
import { provide } from 'angular2/core';
import {
  describe,
  expect,
  it,
  inject,
  beforeEachProviders
} from 'angular2/testing';

import { QuoteService } from './quote.service';
import { RandomNumberService } from './random-number.service';

class StubRandomNumberService {
  pick: (min: number, max: number) => number;
}

describe('QuoteService', () => {

  beforeEachProviders(() => {
    return [
      QuoteService,
      provide(RandomNumberService, {useClass: StubRandomNumberService}),
      provide('QUOTE_DATA', { useValue: [ {
        text: 'Testing is a good thing',
        attribution: 'Me'
      }]})
    ];
  });

  it('should use RandomNumberService to choose a quote',
    inject(
      [QuoteService, RandomNumberService],
      (quoteService: QuoteService,
      stubRandomNumberService: RandomNumberService) => {

      stubRandomNumberService.pick = jasmine.createSpy(
        'pick').and.returnValue(0);

      quoteService.getQuote();

      expect(stubRandomNumberService.pick).toHaveBeenCalledWith(0, 1);
    }));
});
```

## Asynchronous Service Calls

The example above is nice and simple. However in the real
world, we're more likely to get the quote data from a
remote API than from a hard-coded list.

Let's walk through the same exercise, but this time with
an implementation that gets quotes from http://quotesondesign.com/.

First we'll beef up the QuoteComponent to handle async data using Observables and the built-in `asyncPipe` from Angular2:

```typescript
import { IQuote, QuoteService } from '../services/quote.service';
import { Component } from 'angular2/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'my-quote',
  providers: [ QuoteService ],
  template: `
      <h3>Random Quote</h3>
      <blockquote [innerHtml]="text$ | async"></blockquote>
      <p>- {{ attribution$ | async }}</p>
      <button (click)=getQuote()>Get a new quote</button>
  `
})
export class QuoteComponent {
  text$: Observable<String>;
  attribution$: Observable<String>;

  constructor (private quoteService: QuoteService){
    this.getQuote();
  }

  getQuote() {
    const quote$ = this.quoteService.getQuote();
    this.text$ = quote$.map(quote => quote.text);
    this.attribution$ = quote$.map(quote => quote.attribution);
  }
}
```

Next, we'll provide an HTTP-capable implementation of
quote service:

```typescript
import { Injectable } from 'angular2/core';
import { Http, URLSearchParams } from 'angular2/http';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/map';

export type IQuote = {
  text: string,
  attribution: string
};

export type IAPIRecord = {
  content: string,
  title: string
};

@Injectable()
export class QuoteService {
  private static URL = 'http://quotesondesign.com/wp-json/posts';

  constructor(private http: Http) {}

  getQuote(): Observable<IQuote> {
    const search = new URLSearchParams();
    search.set('filter[orderby]', 'rand');

    return this.http.get(QuoteService.URL, { search })
      .map<IAPIRecord[]>(response => response.json())
      .map<IAPIRecord>(records => records[0])
      .map<IQuote>(record => ({
          text: record.content,
          attribution: record.title
        }));
  }
};
```

This implementation is straightforward: it uses Angular2's
`http` service to hit QuotesOnDesign's JSON endpoint, and
then converts their response data to the `IQuote`
interface used by our `QuoteComponent`.

However, this example has two aspects that complicate
testing:

1. It returns data asynchronously using an `Observable`.
2. It relies on Angular2's HTTP infrastructure, which is
difficult to isolate.

Fortunately, Angular2 gives us the tools to handle these
cases as well.

## Handling Asynchronicity

We'll import a new helper from `angular2/testing` called `fakeAsync`. This is
a simple wrapper function that places your test in the "async zone": this causes
asynchronous code to run in a synchronous way via the magic of
[zone.js](https://github.com/angular/zone.js/).

## Mocking out the HTTP Backend

The new implementation of `QuoteService` relies on the `http` service provided
by Angular2. However, because this is a unit test, we don't want to actually
make HTTP calls - we need to be able to control the environment in which our
tests run.

We could use a stub implementation of HTTP as we did above; and in some cases
that's appropriate. However HTTP is a fairly complex interface. In this case,
it's easier to use some mocks that Angular2 has already made available to us:

```typescript
import { MockBackend, MockConnection } from 'angular2/http/testing';
```

Supplying these to Angular2's dependency injector allows us to intercept
outgoing HTTP calls and perform expectations them:

```typescript
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

const mockHttpProvider = {
  deps: [ MockBackend, BaseRequestOptions ],
  useFactory: (backend: MockBackend, defaultOptions: BaseRequestOptions) => {
    return new Http(backend, defaultOptions);
  }
}

describe('QuoteService', () => {
  beforeEachProviders(() => {
    return [
      MockBackend,
      BaseRequestOptions,
      provide(Http, mockHttpProvider)
    ];
  });

  it('should use an HTTP call to obtain a quote',
    inject(
      [QuoteService, MockBackend],
      fakeAsync((service: QuoteService, backend: MockBackend) => {
        backend.connections.subscribe((connection: MockConnection) => {

          expect(connection.request.method).toBe(RequestMethod.Get);
          expect(connection.request.url).toBe(
            'http://quotesondesign.com/wp-json/posts?filter[orderby]=rand');
        });

        service.getQuote();
      })));
});
```

It also allows us to supply controlled response data:

```typescript
  it('should parse the server response correctly', inject(
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

      const parsedQuote$ = service.getQuote()
        .subscribe(quote => {
          expect(quote.text).toEqual('Testing is a good thing');
          expect(quote.attribution).toEqual('Me');
        });
    })));
```

## Wrap-up

Angular2 provides a great set of tools for testing everything from your UI
components down to your HTTP services. Between parts one and two of this series,
you should be equipped to handle most scenarios you may encounter when unit
testing your Angular 2 apps.

The full source code for these examples can be found on 
[github](https://github.com/rangle/ng2-unit-testing-blog)

If you want to learn more, check out some of the following resources:

* [Angular2 testing APIs](https://angular.io/docs/ts/latest/api/testing/)
* [Jasmine unit testing framework](http://jasmine.github.io/)

Happy Testing!
