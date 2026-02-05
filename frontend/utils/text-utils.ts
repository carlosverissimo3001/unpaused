const ordinal = new Intl.PluralRules("en", { type: "ordinal" });
const suffixes = { one: "st", two: "nd", few: "rd", other: "th" };

export function toOrdinal(n: number): string {
  return `${n}${suffixes[ordinal.select(n)] ?? "th"}`;
}