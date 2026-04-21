export type ProductAccent =
  | "default"
  | "lite"
  | "explore"
  | "concierge"
  | "parent_pack"
  | "arrival_call"
  | "additional_support_call"
  | "community"
  | "inactive"
  | "admin";

export const accentHexByProduct: Record<ProductAccent, string> = {
  default: "#3083DC",
  lite: "#3083DC",
  explore: "#4ECBA5",
  concierge: "#9B8EC4",
  parent_pack: "#F5C842",
  arrival_call: "#F5C842",
  additional_support_call: "#F5C842",
  community: "#4ECBA5",
  inactive: "#E54B4B",
  admin: "#E54B4B",
};

const accentSurfaceClassByProduct: Record<ProductAccent, string> = {
  default: "bg-[#3083DC]/10 text-[#3083DC] border border-[#3083DC]/20",
  lite: "bg-[#3083DC]/10 text-[#3083DC] border border-[#3083DC]/20",
  explore: "bg-[#4ECBA5]/10 text-[#4ECBA5] border border-[#4ECBA5]/20",
  concierge: "bg-[#9B8EC4]/10 text-[#9B8EC4] border border-[#9B8EC4]/20",
  parent_pack: "bg-[#F5C842]/10 text-yellow-700 border border-[#F5C842]/30",
  arrival_call: "bg-[#F5C842]/10 text-yellow-700 border border-[#F5C842]/30",
  additional_support_call: "bg-[#F5C842]/10 text-yellow-700 border border-[#F5C842]/30",
  community: "bg-[#4ECBA5]/10 text-[#4ECBA5] border border-[#4ECBA5]/20",
  inactive: "bg-[#E54B4B]/10 text-[#E54B4B] border border-[#E54B4B]/20",
  admin: "bg-[#E54B4B]/10 text-[#E54B4B] border border-[#E54B4B]/20",
};

export function accentSurfaceClass(product: ProductAccent): string {
  return accentSurfaceClassByProduct[product];
}

export function accentIconClass(product: ProductAccent): string {
  return accentSurfaceClassByProduct[product].replace(/ border [^ ]+/, "");
}
