import { QuantDecisionSection } from "./QuantDecisionSection";
import { QuantHeroSection } from "./QuantHeroSection";
import { QuantModelIntro } from "./QuantModelIntro";
import { QuantUtilityRail } from "./QuantUtilityRail";
import { HomeShell, Stack } from "./styles";

export function QuantHomePage() {
  return (
    <HomeShell>
      <Stack>
        <QuantHeroSection />
        <QuantDecisionSection />
        <QuantModelIntro />
      </Stack>
      <QuantUtilityRail />
    </HomeShell>
  );
}
