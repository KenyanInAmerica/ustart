import { fetchFooterConfig } from "@/lib/config/footer";
import { FooterView } from "@/components/ui/FooterView";

export async function Footer() {
  const config = await fetchFooterConfig();
  return <FooterView config={config} />;
}
