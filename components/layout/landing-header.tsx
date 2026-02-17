import Logo from "./logo";

export default function LandingHeader() {
  return (
    <header className="container mx-auto py-4">
      <nav className="flex items-center justify-between">
        <aside>
          <Logo />
        </aside>
        <aside></aside>
      </nav>
    </header>
  );
}
