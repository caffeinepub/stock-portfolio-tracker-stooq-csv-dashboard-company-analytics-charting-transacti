// Ticker mapping hook — uses static company universe
import { COMPANY_UNIVERSE, type Company } from "../data/companyUniverse";

export function useTickerMapping(): [
  Company[],
  (companies: Company[]) => void,
] {
  return [COMPANY_UNIVERSE, () => {}];
}
