import { Helmet } from 'react-helmet-async';
import { LayoutProvider } from './components/context';
import { Main } from './components/main';

export function Layout1({ menu }) {
  return (
    <>
      <Helmet>
        <title>nxzen Portal</title>
      </Helmet>

      <LayoutProvider>
        <Main menu={menu} />
      </LayoutProvider>
    </>
  );
}
