// src/model/horsocope.model.ts

  export interface DailyTarotCard{
    cardNumber: number,
    date: string,
    reversed: boolean
  }

  export interface TarotCard {
      cardNumber: number,
      reversed: boolean,
      date: string,
      timezone: string,
      timestamp: string,
    };