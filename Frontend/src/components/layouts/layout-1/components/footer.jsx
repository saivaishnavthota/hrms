

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-center md:justify-between items-center gap-3 py-5">
          <div className="flex order-2 md:order-1  gap-2 font-normal text-sm">
            <span className="text-muted-foreground">{currentYear} &copy;</span>
            <a
              href="https://nxzen.com"
              target="_blank"
              className="text-secondary-foreground hover:text-primary"
            >
              Nxzen
            </a>
          </div>
          <nav className="flex order-1 md:order-2 gap-4 font-normal text-sm text-muted-foreground">
            {/* <a
              href="/company-policies"
              className="hover:text-primary"
            >
              Company Policies
            </a> */}
            <a
              href="https://www.nxzen.com/about-us"
              target="_blank"
              className="hover:text-primary"
            >
              About Us
            </a>
            <a
              href="https://www.nxzen.com/our-solutions"
              target="_blank"
              className="hover:text-primary"
            >
              Our Solutions
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
