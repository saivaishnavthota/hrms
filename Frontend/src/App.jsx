import { AppRouting } from '@/routing/app-routing';
import { ThemeProvider } from 'next-themes';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { LoadingBarContainer } from 'react-top-loading-bar';
import { Toaster } from '@/components/ui/sonner';
import { ToastContainer } from 'react-toastify';
import { UserProvider } from '@/contexts/UserContext';
import 'react-toastify/dist/ReactToastify.css';

const { BASE_URL } = import.meta.env;

export function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      storageKey="vite-theme"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      <HelmetProvider>
        <LoadingBarContainer>
          <BrowserRouter basename={BASE_URL}>
            <UserProvider>
              <Toaster />
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />
              <AppRouting />
            </UserProvider>
          </BrowserRouter>
        </LoadingBarContainer>
      </HelmetProvider>
    </ThemeProvider>
  );
}
