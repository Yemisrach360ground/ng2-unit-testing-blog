import { bootstrap } from 'angular2/bootstrap';
import { HTTP_PROVIDERS } from 'angular2/http';
import { provide } from 'angular2/core';
import { QuoteComponent } from './components/quote.component';
import { QuoteService } from './services/quote.service';
import { RandomNumberService } from './services/random-number.service';
import { quotes } from './services/quote.data';

bootstrap(QuoteComponent, [
  HTTP_PROVIDERS,
  QuoteService,
  RandomNumberService,
  provide('QUOTE_DATA', { useValue: quotes })
]);