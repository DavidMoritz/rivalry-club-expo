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
  ) => { winnerPosition: number | null; loserPosition: number | null } | void;
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

    // setters
    set currentContest(contest: MContest | undefined) {
      this._currentContest = contest;
    },
    set game(game: MGame | undefined) {
      this._mGame = game;
    },
    set mContests(contests: MContest[]) {
      this._mContests = contests;
    },
    set tierListA(tierList: MTierList | undefined) {
      this._mTierListA = tierList;
    },
    set tierListB(tierList: MTierList | undefined) {
      this._mTierListB = tierList;
    },
    set userA(user: MUser | undefined) {
      this._mUserA = user;
    },
    set userB(user: MUser | undefined) {
      this._mUserB = user;
    },

    // getters
    get currentContest() {
      return this._currentContest;
    },
    get game() {
      return this._mGame;
    },
    get mContests() {
      return this._mContests;
    },
    get tierListA() {
      return this._mTierListA;
    },
    get tierListB() {
      return this._mTierListB;
    },
    get userA() {
      return this._mUserA;
    },
    get userB() {
      return this._mUserB;
    },

    // methods
    /**
     * Alter the tierLists' standings based on the current contest.
     * @returns Object with winner and loser positions, or void if contest data is invalid
     */
    adjustStanding(
      nudge?: number
    ): { winnerPosition: number | null; loserPosition: number | null } | void {
      if (!(this.currentContest && this.tierListA && this.tierListB)) return;

      const winner = this.currentContest.getWinner();
      const loser = this.currentContest.getLoser();

      if (
        !(
          winner?.tierList &&
          winner?.tierSlot &&
          loser?.tierList &&
          loser?.tierSlot
        )
      ) {
        return;
      }

      let winnerPosition = winner.tierSlot.position;
      let loserPosition = loser.tierSlot.position;
      // Arbitrary number to allow rapid tier placement of new fighters
      const POSITION_BIAS = 11;
      const MIDPOINT = 42; // midpoint (0-based: 85/2) if also unknown
      // NEW: Position unknown fighters BEFORE adjusting positions
      const result = this.currentContest.result as number;
      const winnerInitalPosition = winner.tierSlot.position ?? MIDPOINT;
      const loserInitialPosition = loser.tierSlot.position ?? MIDPOINT;

      // Position unknown fighter for winner
      if (
        winner.tierSlot.position === null ||
        winner.tierSlot.position === undefined
      ) {
        const winnerOffset = Math.abs(result) * POSITION_BIAS; // result is 1, 2, or 3
        const winnerNewPosition = loserInitialPosition - winnerOffset; // winner moves UP (lower position number)
        winner.tierList.positionUnknownFighter(
          winner.tierSlot,
          winnerNewPosition
        );
        winnerPosition = winnerNewPosition;
      }

      // Position unknown fighter for loser
      if (
        loser.tierSlot.position === null ||
        loser.tierSlot.position === undefined
      ) {
        const offset = Math.abs(result) * POSITION_BIAS;
        const calculatedPosition = winnerInitalPosition + offset; // loser moves DOWN (higher position number)

        loser.tierList.positionUnknownFighter(
          loser.tierSlot,
          calculatedPosition
        );
        loserPosition = calculatedPosition;
      }

      // EXISTING: Continue with normal standings adjustment
      const stocks = Math.abs(this.currentContest.result as number);

      const bothPlayersMoveCount = Math.floor(stocks / MOVEMENT_DIRECTIONS);
      const additionalMove = Boolean(stocks % MOVEMENT_DIRECTIONS);

      for (let i = 0; i < bothPlayersMoveCount; i++) {
        winner.tierList.moveDownATier();

        if (!loser.tierList.moveUpATier()) {
          // Winner moves twice if loser is on top tier
          winner.tierList.moveDownATier();
        }
      }

      if (additionalMove) {
        const winnerIsOnLowestTier =
          ((winner.tierList.standing as number) + 1) % TIERS.length === 0;
        const loserIsOnHighestTier =
          (loser.tierList.standing as number) % TIERS.length === 0;
        const preferLoserToMove =
          !loserIsOnHighestTier &&
          ((nudge && nudge > 0) ||
            (nudge === undefined && Math.random() < 0.5));

        if (
          (winnerIsOnLowestTier || preferLoserToMove) &&
          loser.tierList.moveUpATier()
        ) {
          this.currentContest.bias = 1;
        } else {
          winner?.tierList.moveDownATier();
          this.currentContest.bias = -1;
        }
      }

      const tlA = this.tierListA;
      const tlB = this.tierListB;

      while ([tlA, tlB].every(tl => tl.getPrestige() > 0)) {
        tlA.standing = Math.max((tlA.standing as number) - TIERS.length, 0);
        tlB.standing = Math.max((tlB.standing as number) - TIERS.length, 0);
      }

      return {
        winnerPosition: winnerPosition ?? null,
        loserPosition: loserPosition ?? null,
      };
    },
    reverseStanding(contest: MContest) {
      if (!(contest && this.tierListA && this.tierListB)) return;

      const winner = contest.getWinner();
      const loser = contest.getLoser();

      if (
        !(
          winner?.tierList &&
          winner?.tierSlot &&
          loser?.tierList &&
          loser?.tierSlot
        )
      ) {
        return;
      }

      const stocks = Math.abs(contest.result as number);

      const bothPlayersMoveCount = Math.floor(stocks / MOVEMENT_DIRECTIONS);
      const additionalMove = Boolean(stocks % MOVEMENT_DIRECTIONS);

      const tlA = this.tierListA;
      const tlB = this.tierListB;

      // Store current prestige levels before reversal
      const currentPrestigeA = tlA.getPrestige();
      const currentPrestigeB = tlB.getPrestige();

      // 2. Reverse the additional move using the bias (this happens second-to-last in adjustStanding)
      if (additionalMove) {
        if (contest.bias === 1) {
          // Loser moved up, so reverse it by moving down
          loser.tierList.moveDownATier();
        } else if (contest.bias === -1) {
          // Winner moved down, so reverse it by moving up
          winner.tierList.moveUpATier();
        }
      }

      // 3. Reverse the main movements (these happen first in adjustStanding)
      // We need to reverse them, which means checking if loser is NOW at top after reversal
      for (let i = 0; i < bothPlayersMoveCount; i++) {
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

      // 4. Restore prestige that was removed during adjustStanding
      // adjustStanding's prestige logic (lines 178-181):
      //   while (both have prestige > 0) { subtract TIERS.length from both }
      // To reverse this, we add TIERS.length back while both are at prestige 0
      // BUT we need to check if prestige was actually removed
      //
      // The trick: after reversing moves, if both started at prestige 0 (before our reversal)
      // but now have prestige > 0, it means the original adjustStanding removed prestige
      const afterPrestigeA = tlA.getPrestige();
      const afterPrestigeB = tlB.getPrestige();

      if (
        currentPrestigeA === 0 &&
        currentPrestigeB === 0 &&
        afterPrestigeA > 0 &&
        afterPrestigeB > 0
      ) {
        // Both gained prestige during move reversals
        // This means they both had prestige before adjustStanding, which removed it
        // We need to restore it - keep the current standings (prestige already added by move reversals)
      } else if (
        currentPrestigeA === 0 &&
        currentPrestigeB === 0 &&
        (afterPrestigeA === 0 || afterPrestigeB === 0)
      ) {
        // At least one is still at prestige 0 after reversals
        // No prestige was removed during adjustStanding, standings are correct
      }
      // Note: We don't use a while loop here because move reversals already handle the standing changes
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
