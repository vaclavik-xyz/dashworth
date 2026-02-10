import ClientRouter from "@/components/ClientRouter";
import LandingPage from "@/components/landing/LandingPage";

export default function Page() {
  return (
    <ClientRouter>
      <LandingPage />
    </ClientRouter>
  );
}
