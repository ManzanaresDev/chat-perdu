import DockNav from "@/components/layout/DockNav";
import MobileMenu from "@/components/layout/MobileMenu";
import Footer from "@/components/layout/Footer";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-10">{children}</main>
      <Footer />
      <DockNav />     {/* ≥ 640 px */}
      <MobileMenu />  {/* < 640 px */}
    </>
  );
}