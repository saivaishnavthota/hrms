import { Helmet } from 'react-helmet-async';
import { LayoutProvider } from './components/context';
import { Main } from './components/main';

export function Layout1() {
  return (
    <>
      <Helmet>
        <title>HR Employee Portal</title>
      </Helmet>

      <LayoutProvider>
        <Main />
      </LayoutProvider>
    </>
  );
}
