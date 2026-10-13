import Hero from "@/components/Hero/Hero";
// import LatestAds from "@/components/home/LatestAds";
import Footer from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <>
    <Hero variant="video" fit="contain" position="center 22%" zoom={1} />
{/* <Hero fit="cover" position="center 22%" zoom={1} /> */}
{/* <Hero fit="cover" position="center 30%" />      */}
{/* <Hero variant="video" />                       */}
{/* <Hero variant="video" fit="cover" />           */}
      <main id="dernieres-annonces" className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="font-display text-3xl sm:text-4xl">Dernières annonces</h2>
        <p className="mt-2 text-night-800/70">Un coup d'œil peut tout changer.</p>
        {/* <LatestAds /> */}
      </main>
      <Footer />
    </>
  );
}
