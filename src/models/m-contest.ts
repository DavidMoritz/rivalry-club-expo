import type { Schema } from '../../amplify/data/resource';
import { MRivalry } from './m-rivalry';
import { MTierList } from './m-tier-list';
import { MTierSlot } from './m-tier-slot';
import { MUser } from './m-user';

// Extract Gen 2 type
type Contest = Schema['Contest']['type'];

type ParticipantDetail = {
  user?: MUser;
  fighterId?: string;
  tierList?: MTierList;
  tierSlot?: MTierSlot;
};

export interface MContest extends Contest {
  _mTierSlotA?: MTierSlot;
  _mTierSlotB?: MTierSlot;
  _mRivalry?: MRivalry;
  baseContest: Contest;
  getDetailsA(): ParticipantDetail;
  getDetailsB(): ParticipantDetail;
  getLoser(): ParticipantDetail | undefined;
  getWinner(): ParticipantDetail | undefined;
  // resolve(result: number, verbose?: boolean, nudge?: 1 | -1): void;
  rivalry?: MRivalry;
  setRivalryAndSlots(rivalry: MRivalry): void;
  tierSlotA?: MTierSlot;
  tierSlotB?: MTierSlot;
}

export function getMContest(contest: Contest): MContest {
  return {
    ...contest,

    // private
    _mRivalry: undefined,
    _mTierSlotA: undefined,
    _mTierSlotB: undefined,

    // public
    baseContest: contest,

    // setters
    set rivalry(rivalry: MRivalry | undefined) {
      this._mRivalry = rivalry;
    },

    set tierSlotA(tierSlot: MTierSlot | undefined) {
      this._mTierSlotA = tierSlot;
    },
    set tierSlotB(tierSlot: MTierSlot | undefined) {
      this._mTierSlotB = tierSlot;
    },

    // getters
    get rivalry() {
      return this._mRivalry;
    },
    get tierSlotA() {
      return this._mTierSlotA;
    },
    get tierSlotB() {
      return this._mTierSlotB;
    },

    // methods
    // resolve(newResult: number, verbose = false, nudge?: 1 | -1) {
    //   this.result = newResult;

    //   // if (verbose) declareResult(true);

    //   const stocks = Math.abs(newResult);
    //   const MOVEMENT_DIRECTIONS = 2; // up or down
    //   const numTiers = TIERS.length;

    //   /** integer division (no fractions... e.g. `7 / 2 = 3` and `1 / 2 = 0`) */
    //   const bothPlayersMoveCount = stocks / MOVEMENT_DIRECTIONS;
    //   const additionalMove = !!(stocks % MOVEMENT_DIRECTIONS);

    /** for every 2 stocks, both players move, if possible */
    // [...Array(bothPlayersMoveCount)].forEach(() => {
    //   this.winner?.tierList?.moveDownATier()

    //   if (loser[:tierList].moveUpATier

    //   // winner moves twice if loser is on top tier
    //   winner[:tierList].moveDownATier
    // })
    // Array( bothPlayersMoveCount.times do
    //   winner[:tierList].moveDownATier

    //   next if loser[:tierList].moveUpATier

    //   // winner moves twice if loser is on top tier
    //   winner[:tierList].moveDownATier
    // end

    // // resolve once if result has an odd number of stocks (1, 3, etc.)
    // if additionalMove
    //   winnerIsOnLowestTier = ((winner[:tierList].standing + 1) % numTiers).zero?
    //   loserIsOnHighestTier = (loser[:tierList].standing % numTiers).zero?
    //   bias = nil

    //   // IF winner is on F tier...
    //   // OR nudge (1, -1, or nil), which influences bias, is positive...
    //   // OR 50% chance (as long as nudge IS nil!)
    //   // try to move loser up
    //   if (
    //     winnerIsOnLowestTier || (
    //       !loserIsOnHighestTier && (
    //         nudge.try(:positive?) || (
    //           nudge.nil? && [true, false].sample
    //         )
    //       )
    //     )
    //   )
    //     if loser[:tierList].moveUpATier
    //       bias = 1
    //     else
    //       winner[:tierList].moveDownATier // only if loser is on top tier
    //       bias = -1
    //     end
    //   else
    //     winner[:tierList].moveDownATier
    //     bias = -1
    //   end

    //   update(bias: bias)
    // end

    // tlA = rivalry.tierListA
    // tlB = rivalry.tierListB

    // // if both players would prestige, make them both lose one prestige
    // while [tlA, tlB].map { |tl| tl.prestige.positive? }.all? do
    //   tlA.update(standing: tlA.standing - numTiers)
    //   tlB.update(standing: tlB.standing - numTiers)
    // end

    // // resolve fighters' new positions
    // if winner[:tierSlot].higherItems.size > fighterMoves
    //   winner[:tierSlot].insertAt(winner[:tierSlot].position - fighterMoves)
    // else
    //   winner[:tierSlot].moveToTop
    // end

    // if loser[:tierSlot].lowerItems.size > fighterMoves
    //   loser[:tierSlot].insertAt(loser[:tierSlot].position + fighterMoves)
    // else
    //   loser[:tierSlot].moveToBottom
    // end

    // true // contest resolved successfully
    //   return;
    // },
    getDetailsA() {
      return {
        user: this.rivalry?.userA,
        fighterId: this.tierSlotA?.fighterId,
        tierList: this.rivalry?.tierListA,
        tierSlot: this.tierSlotA
      };
    },
    getDetailsB() {
      return {
        user: this.rivalry?.userB,
        fighterId: this.tierSlotB?.fighterId,
        tierList: this.rivalry?.tierListB,
        tierSlot: this.tierSlotB
      };
    },
    getLoser() {
      if (!this.result) return;

      return this.result < 0 ? this.getDetailsA() : this.getDetailsB();
    },
    getWinner() {
      if (!this.result) return;

      return this.result > 0 ? this.getDetailsA() : this.getDetailsB();
    },

    setRivalryAndSlots(rivalry) {
      this.rivalry = rivalry;

      this.tierSlotA = rivalry.tierListA?.slots.find(
        (thisTierSlot) => thisTierSlot?.id === this.tierSlotAId
      );
      this.tierSlotB = rivalry.tierListB?.slots.find(
        (thisTierSlot) => thisTierSlot?.id === this.tierSlotBId
      );

      if (!this.tierSlotA || !this.tierSlotB) {
        console.warn('[MContest] Failed to find tier slots for contest:', this.id);
      }
    }
  };
}
