import type { Schema } from '../../amplify/data/resource';
import { getMContest, type MContest } from './m-contest';
import { type MGame, STEPS_PER_STOCK } from './m-game';
import { getMTierList, type MTierList, TIERS } from './m-tier-list';
import type { MUser } from './m-user';

// Extract Gen 2 types from the schema
type Rivalry = Schema['Rivalry']['type'];
type Contest = Schema['Contest']['type'];
type TierList = Schema['TierList']['type'];

// Gen 2 doesn't have ModelConnection types - we'll define them based on API responses
type ModelContestConnection = {
  items: Array<Contest | null>;
  nextToken?: string | null;
};

type ModelTierListConnection = {
  items: Array<TierList | null>;
  nextToken?: string | null;
};

export interface MRivalry extends Omit<Rivalry, 'game'> {
  _currentContest?: MContest;
  _mContests: MContest[];
  _mGame?: MGame;
  _mTierListA?: MTierList;
  _mTierListB?: MTierList;
  _mUserA?: MUser;
  _mUserB?: MUser;
  adjustStanding: (
    nudge?: number
  ) =>
    | { winnerPosition: number | null; loserPosition: number | null }
    | undefined;
  reverseStanding: (contest: MContest) => void;
  baseRivalry: Rivalry;
  currentContest?: MContest;
  displayTitle: () => string;
  displayUserAName: () => string;
  displayUserBName: () => string;
  fighterMoves: () => number;
  game?: MGame;
  getCurrentContest: () => MContest | undefined;
  mContests: MContest[];
  setCurrentContest: (contest: MContest) => void;
  setMContests: (contestConnection: ModelContestConnection | undefined) => void;
  setMTierLists: (
    tierListConnection: ModelTierListConnection | undefined
  ) => void;
  // title: string;
  tierListA?: MTierList;
  tierListB?: MTierList;
  userA?: MUser;
  userB?: MUser;
}

export interface GetMRivalryProps {
  rivalry: Rivalry;
}

const MOVEMENT_DIRECTIONS = 2; // up or down (winner and loser both move)
const RANDOM_THRESHOLD = 0.5; // 50% chance for random tiebreaker
const POSITION_BIAS = 11; // Arbitrary number to allow rapid tier placement of new fighters
const MIDPOINT = 42; // midpoint (0-based: 85/2) if also unknown

// Types for contest participants
interface ContestParticipant {
  tierList: MTierList;
  tierSlot: { position: number | null | undefined };
}

// Helper: Check if a fighter's position is unknown
function isPositionUnknown(
  position: number | null | undefined
): position is null | undefined {
  return position === null || position === undefined;
}

// Helper: Position an unknown fighter based on contest result
function positionUnknownFighter(
  participant: ContestParticipant,
  opponentPosition: number,
  result: number,
  isWinner: boolean
): number {
  const offset = Math.abs(result) * POSITION_BIAS;
  const newPosition = isWinner
    ? opponentPosition - offset // winner moves UP (lower position number)
    : opponentPosition + offset; // loser moves DOWN (higher position number)

  participant.tierList.positionUnknownFighter(
    participant.tierSlot as Parameters<MTierList['positionUnknownFighter']>[0],
    newPosition
  );

  return newPosition;
}

// Helper: Process main tier movements for both players
function processMainMovements(
  winner: ContestParticipant,
  loser: ContestParticipant,
  moveCount: number
): void {
  for (let i = 0; i < moveCount; i++) {
    winner.tierList.moveDownATier();

    if (!loser.tierList.moveUpATier()) {
      // Winner moves twice if loser is on top tier
      winner.tierList.moveDownATier();
    }
  }
}

// Helper: Process additional move with bias
function processAdditionalMove(
  winner: ContestParticipant,
  loser: ContestParticipant,
  nudge: number | undefined,
  contest: MContest
): void {
  const winnerIsOnLowestTier =
    ((winner.tierList.standing as number) + 1) % TIERS.length === 0;
  const loserIsOnHighestTier =
    (loser.tierList.standing as number) % TIERS.length === 0;
  const preferLoserToMove =
    !loserIsOnHighestTier &&
    ((nudge && nudge > 0) ||
      (nudge === undefined && Math.random() < RANDOM_THRESHOLD));

  if (
    (winnerIsOnLowestTier || preferLoserToMove) &&
    loser.tierList.moveUpATier()
  ) {
    contest.bias = 1;
  } else {
    winner.tierList.moveDownATier();
    contest.bias = -1;
  }
}

// Helper: Normalize prestige for both tier lists
function normalizePrestige(tlA: MTierList, tlB: MTierList): void {
  while ([tlA, tlB].every(tl => tl.getPrestige() > 0)) {
    tlA.standing = Math.max((tlA.standing as number) - TIERS.length, 0);
    tlB.standing = Math.max((tlB.standing as number) - TIERS.length, 0);
  }
}

// Helper: Reverse additional move based on bias
function reverseAdditionalMove(
  winner: ContestParticipant,
  loser: ContestParticipant,
  bias: number | null | undefined
): void {
  if (bias === 1) {
    // Loser moved up, so reverse it by moving down
    loser.tierList.moveDownATier();
  } else if (bias === -1) {
    // Winner moved down, so reverse it by moving up
    winner.tierList.moveUpATier();
  }
}

// Helper: Reverse main movements
function reverseMainMovements(
  winner: ContestParticipant,
  loser: ContestParticipant,
  moveCount: number
): void {
  for (let i = 0; i < moveCount; i++) {
    // Check if loser WAS blocked (we can tell if they're now at top after other reversals)
    const loserWasBlocked = (loser.tierList.standing as number) === 0;

    if (loserWasBlocked) {
      // Winner moved down twice, so move up twice
      winner.tierList.moveUpATier();
      winner.tierList.moveUpATier();
    } else {
      // Normal case: winner moved down once, loser moved up once
      winner.tierList.moveUpATier();
      loser.tierList.moveDownATier();
    }
  }
}

// Helper: Resolve positions for unknown fighters
function resolveUnknownPositions(
  winner: ContestParticipant,
  loser: ContestParticipant,
  result: number
): {
  winnerPosition: number | null | undefined;
  loserPosition: number | null | undefined;
} {
  const winnerInitialPosition = winner.tierSlot.position ?? MIDPOINT;
  const loserInitialPosition = loser.tierSlot.position ?? MIDPOINT;

  let winnerPosition = winner.tierSlot.position;
  let loserPosition = loser.tierSlot.position;

  if (isPositionUnknown(winner.tierSlot.position)) {
    winnerPosition = positionUnknownFighter(
      winner,
      loserInitialPosition,
      result,
      true
    );
  }

  if (isPositionUnknown(loser.tierSlot.position)) {
    loserPosition = positionUnknownFighter(
      loser,
      winnerInitialPosition,
      result,
      false
    );
  }

  return { winnerPosition, loserPosition };
}

export function getMRivalry({ rivalry }: GetMRivalryProps): MRivalry {
  return {
    ...rivalry,
    baseRivalry: rivalry,

    // private
    _currentContest: undefined,
    _mContests: [],
    _mTierListA: undefined,
    _mTierListB: undefined,
    _mUserA: undefined,
    _mUserB: undefined,

    // getters and setters (paired together)
    get currentContest() {
      return this._currentContest;
    },
    set currentContest(contest: MContest | undefined) {
      this._currentContest = contest;
    },
    get game() {
      return this._mGame;
    },
    set game(game: MGame | undefined) {
      this._mGame = game;
    },
    get mContests() {
      return this._mContests;
    },
    set mContests(contests: MContest[]) {
      this._mContests = contests;
    },
    get tierListA() {
      return this._mTierListA;
    },
    set tierListA(tierList: MTierList | undefined) {
      this._mTierListA = tierList;
    },
    get tierListB() {
      return this._mTierListB;
    },
    set tierListB(tierList: MTierList | undefined) {
      this._mTierListB = tierList;
    },
    get userA() {
      return this._mUserA;
    },
    set userA(user: MUser | undefined) {
      this._mUserA = user;
    },
    get userB() {
      return this._mUserB;
    },
    set userB(user: MUser | undefined) {
      this._mUserB = user;
    },

    // methods
    /**
     * Alter the tierLists' standings based on the current contest.
     * @returns Object with winner and loser positions, or undefined if contest data is invalid
     */
    adjustStanding(
      nudge?: number
    ):
      | { winnerPosition: number | null; loserPosition: number | null }
      | undefined {
      if (!(this.currentContest && this.tierListA && this.tierListB)) return;

      const winner = this.currentContest.getWinner();
      const loser = this.currentContest.getLoser();

      const hasValidParticipants =
        winner?.tierList &&
        winner?.tierSlot &&
        loser?.tierList &&
        loser?.tierSlot;
      if (!hasValidParticipants) return;

      const result = this.currentContest.result as number;

      // Position unknown fighters BEFORE adjusting positions
      const { winnerPosition, loserPosition } = resolveUnknownPositions(
        winner as ContestParticipant,
        loser as ContestParticipant,
        result
      );

      // Continue with normal standings adjustment
      const stocks = Math.abs(result);
      const bothPlayersMoveCount = Math.floor(stocks / MOVEMENT_DIRECTIONS);
      const additionalMove = Boolean(stocks % MOVEMENT_DIRECTIONS);

      processMainMovements(winner as ContestParticipant, loser as ContestParticipant, bothPlayersMoveCount);

      if (additionalMove) {
        processAdditionalMove(winner as ContestParticipant, loser as ContestParticipant, nudge, this.currentContest);
      }

      normalizePrestige(this.tierListA, this.tierListB);

      return {
        winnerPosition: winnerPosition ?? null,
        loserPosition: loserPosition ?? null,
      };
    },
    reverseStanding(contest: MContest) {
      if (!(contest && this.tierListA && this.tierListB)) return;

      const winner = contest.getWinner();
      const loser = contest.getLoser();

      const hasValidParticipants =
        winner?.tierList &&
        winner?.tierSlot &&
        loser?.tierList &&
        loser?.tierSlot;
      if (!hasValidParticipants) return;

      const stocks = Math.abs(contest.result as number);
      const bothPlayersMoveCount = Math.floor(stocks / MOVEMENT_DIRECTIONS);
      const additionalMove = Boolean(stocks % MOVEMENT_DIRECTIONS);

      // Reverse the additional move using the bias (this happens second-to-last in adjustStanding)
      if (additionalMove) {
        reverseAdditionalMove(winner as ContestParticipant, loser as ContestParticipant, contest.bias);
      }

      // Reverse the main movements (these happen first in adjustStanding)
      reverseMainMovements(winner as ContestParticipant, loser as ContestParticipant, bothPlayersMoveCount);

      // Note: Prestige restoration is handled implicitly by the move reversals.
      // The original adjustStanding normalized prestige after moves, and reversing
      // the moves naturally restores the pre-adjustment prestige levels.
    },
    displayTitle() {
      return `${this.displayUserAName()} vs. ${this.displayUserBName()}`;
    },
    displayUserAName() {
      return this.userA?.displayName(this.userB || '') || 'User A';
    },
    displayUserBName() {
      return this.userB?.displayName(this.userA || '') || 'User B';
    },
    fighterMoves() {
      // Fighter always makes STEPS_PER_STOCK moves per stock
      const stocks = Math.abs(this.currentContest?.result as number);

      return stocks * STEPS_PER_STOCK;
    },
    getCurrentContest() {
      if (this.currentContest?.id !== this.currentContestId) {
        console.warn(
          '[MRivalry.getCurrentContest] this.currentContestId mismatch'
        );
      }

      return this.currentContest;
    },
    setCurrentContest(contest: MContest) {
      if (contest) {
        const contests = [...this.mContests];
        contests.unshift(contest);
        this.mContests = contests;
      }

      this.currentContestId = contest?.id;
      this.currentContest = contest;
    },
    setMContests(contestConnection: ModelContestConnection | undefined) {
      this.mContests =
        (contestConnection?.items
          .map((ctst: Contest | null) => ctst && getMContest(ctst))
          .filter(Boolean) as MContest[]) || [];

      this.currentContest = this.mContests.find(
        ctst => ctst.id === this.currentContestId
      );
    },
    setMTierLists(tierListConnection: ModelTierListConnection | undefined) {
      const tLists =
        (tierListConnection?.items
          .map((tL: TierList | null) => {
            if (!tL) return tL;

            const mTL = getMTierList(tL);
            mTL.rivalry = this;

            return mTL;
          })
          .filter(Boolean) as MTierList[]) || [];

      this.tierListA = tLists.find(tL => tL.userId === this.userAId);
      this.tierListB = tLists.find(tL => tL.userId === this.userBId);

      if (!(this.tierListA && this.tierListB)) {
        console.warn(
          '[MRivalry.setMTierLists] Failed to match tier lists to users'
        );
      }
    },
  };
}
