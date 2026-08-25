// TAD §D.6.3 (closes A18, A19, A20) — selection, filter and page as one
// object with one reducer, so they cannot disagree.
import type { BusinessLine, Rating } from '../../data/types.ts';

export interface KycState {
  readonly selectedLine: 'book' | BusinessLine | null; // null = nothing selected
  readonly rating: Rating | 'All'; // default 'High' (§D.6.10)
  readonly page: number; // 1-based
}

export type KycAction =
  | { type: 'selectLine'; line: 'book' | BusinessLine }
  | { type: 'deselect' }
  | { type: 'setRating'; rating: Rating | 'All' }
  | { type: 'setPage'; page: number }
  | { type: 'resultSetChanged' }; // horizon change (§D.6.3's Implementation Note) — resets page only

export const initialKycState: KycState = { selectedLine: null, rating: 'High', page: 1 };

/**
 * Three invariants this reducer guarantees (TAD §D.6.3):
 *  1. selectLine on the already-selected line is deselect — closing the
 *     panel, deselecting and re-expanding are one action.
 *  2. page resets to 1 whenever the result set's identity changes: a line
 *     change, a filter change, or a horizon change (the last dispatched
 *     by the module component as 'resultSetChanged', since horizon lives
 *     in SessionStateProvider, not here).
 *  3. The Records panel is visible iff selectedLine !== null; the
 *     Comparison is full-height iff selectedLine === null — both are
 *     derivations of this one field, computed by the caller, never a
 *     separate stored boolean.
 */
export function kycReducer(state: KycState, action: KycAction): KycState {
  switch (action.type) {
    case 'selectLine':
      if (state.selectedLine === action.line) return { ...state, selectedLine: null, page: 1 };
      return { ...state, selectedLine: action.line, page: 1 };
    case 'deselect':
      return { ...state, selectedLine: null, page: 1 };
    case 'setRating':
      return { ...state, rating: action.rating, page: 1 };
    case 'setPage':
      return { ...state, page: action.page };
    case 'resultSetChanged':
      return state.page === 1 ? state : { ...state, page: 1 };
    default:
      return state;
  }
}
