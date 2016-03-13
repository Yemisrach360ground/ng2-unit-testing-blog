import { Injectable } from 'angular2/core';

@Injectable()
export class RandomNumberService {
  pick(min:number, max:number) {
    return Math.floor(
      Math.random() * (max - min) + min);
  }
}
