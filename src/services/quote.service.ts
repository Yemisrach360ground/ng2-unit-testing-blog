import { Inject, Injectable } from 'angular2/core';
import { Http } from 'angular2/http';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/map';
import { RandomNumberService } from './random-number.service';

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
  constructor(
    private randomNumberService: RandomNumberService,
    @Inject('QUOTE_DATA') private allQuotes: IQuote[],
    private http: Http) {}
  
  getRandomQuote(): IQuote {
    return this.allQuotes[
      this.randomNumberService.pick(
        0,
        this.allQuotes.length)]
  }

  getRemoteQuote(): Observable<IQuote> {
    return this.http.get('http://quotesondesign.com/wp-json/posts?filter[orderby]=rand')
      .map<IAPIRecord[]>(response => response.json())
      .map<IAPIRecord>(records => records[0])
      .map<IQuote>(record => {
        return {
          text: record.content,
          attribution: record.title
        };
      });
  }
};
