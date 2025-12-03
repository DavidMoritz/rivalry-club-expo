import {
  Contest,
  ModelContestConnection,
  ModelTierListConnection,
  Rivalry,
  TierList,
} from '../API';
import { getMContest, MContest } from './m-contest';
import { MGame } from './m-game';
import { getMTierList, MTierList, TIERS } from './m-tier-list';
import { MUser } from './m-user';

export interface MRivalry extends Rivalry {
  _currentContest?: MContest;
  _mContests: MContest[];
  _mGame?: MGame;
  _mTierListA?: MTierList;
  _mTierListB?: MTierList;
  _mUserA?: MUser;
  _mUserB?: MUser;
  adjustStanding: (nudge?: number) => void;
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
    tierListConnection: ModelTierListConnection | undefined,
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
     * @returns void
     */
    adjustStanding(nudge?: number) {
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

      const stocks = Math.abs(this.currentContest.result as number);
      const MOVEMENT_DIRECTIONS = 2;

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
      // Fighter always makes 3 moves per stock
      const stocks = Math.abs(this.currentContest?.result as number);
      const fighterMovesPerStock = 3;

      return stocks * fighterMovesPerStock;
    },
    getCurrentContest() {
      if (this.currentContest?.id !== this.currentContestId) {
        // FIXME: we want to use the current contest and assign it
        // this.currentContest = this.mContests.find(
        //   ctst => ctst.id === this.currentContestId,
        // );
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
        ctst => ctst.id === this.currentContestId,
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

      this.tierListA = tLists.find(tL => tL.userId === rivalry.userAId);
      this.tierListB = tLists.find(tL => tL.userId === rivalry.userBId);
    },
  };
}
