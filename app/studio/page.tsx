import Link from "next/link";
import { StudioDashboard, StudioLogin } from "@/components/Studio";
import { isStudioAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const authenticated = await isStudioAuthenticated();
  return (
    <main className="studio-shell">
      <header className="studio-topbar">
        <Link className="brand" href="/" aria-label="TAS TV, antenne">
          <span className="brand-mark">T</span><span>TAS<span className="brand-light">TV</span></span>
        </Link>
        <span className="studio-top-label">STUDIO DE PROGRAMMATION</span>
        <Link className="studio-back" href="/">← Antenne</Link>
      </header>
      {authenticated ? <StudioDashboard /> : <StudioLogin />}
    </main>
  );
}
