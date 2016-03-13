import { IQuote, QuoteService } from '../services/quote.service';
import { Component } from 'angular2/core';
import { Observable } from 'rxjs';

@Component({
    selector: 'my-quote',
    providers: [ QuoteService ],
    template: `
        <h3>Random Quote</h3>
        <blockquote>{{ randomQuote.text }}</blockquote>
        <p>- {{ randomQuote.attribution }}</p>
        <button (click)=getRandomQuote()>Get a new random quote</button>

        <h3>Remote Quote</h3>
        <blockquote [innerHtml]="remoteText$ | async"></blockquote>
        <p>- {{ remoteAttribution$ | async }}</p>
        <button (click)=getRemoteQuote()>Get a new remote quote</button>
    `
})
export class QuoteComponent {
  randomQuote: IQuote;
  remoteText$: Observable<String>;
  remoteAttribution$: Observable<String>;

  constructor (private quoteService: QuoteService){
    this.getRandomQuote();
    this.getRemoteQuote();
  }

  getRandomQuote() {
    this.randomQuote = this.quoteService.getRandomQuote();
  }

  getRemoteQuote() {
    const quote$ = this.quoteService.getRemoteQuote();
    this.remoteText$ = quote$.map(quote => quote.text);
    this.remoteAttribution$ = quote$.map(quote => quote.attribution);
  }
}
