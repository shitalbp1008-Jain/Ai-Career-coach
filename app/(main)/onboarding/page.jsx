import { getUserOnboardingStatus } from "@/actions/user";
import { industries } from "@/data/industries";
import OnboardingFrom from "./_components/onboarding-from";
import { redirect } from "next/navigation";



const OnboardingPage = async () => {

    // Check if user is already onboarded
  const { isOnboarded } = await getUserOnboardingStatus();

  if (isOnboarded) {
    redirect("/dashboard");
  }
  return (
    <main>
      <OnboardingFrom industries={industries} />
    </main>
  )
}

export default OnboardingPage
