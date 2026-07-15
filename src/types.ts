export type HouseColor = 'red' | 'yellow' | 'blue' | 'green';
export type Sport = 'football' | 'basketball' | 'volleyball';
export type EventStatus = 'scheduled' | 'live' | 'completed';
export type BetStatus = 'pending' | 'won' | 'lost';
export type TransactionStatus = 'pending' | 'completed';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  houseColor: HouseColor | '';
  balance: number;
  createdAt: number;
  updatedAt: number;
}

export interface SportEvent {
  id: string;
  sport: Sport;
  phase: string;
  teamA: HouseColor;
  teamB: HouseColor;
  scoreA: number;
  scoreB: number;
  oddsA: number;
  oddsB: number;
  oddsDraw: number;
  status: EventStatus;
  winner?: string;
  startTime: number;
}

export interface Bet {
  id: string;
  userId: string;
  eventId: string;
  prediction: string;
  amount: number;
  potentialPayout: number;
  status: BetStatus;
  createdAt: number;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  method: 'tng';
  status: TransactionStatus;
  createdAt: number;
}
