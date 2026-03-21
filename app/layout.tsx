import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { UserProvider } from '@/context/UserContext';

export const metadata: Metadata = {
  title: 'Pacepal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          <div className="shell">
            <Sidebar />
            <main className="main">{children}</main>
          </div>
        </UserProvider>
      </body>
    </html>
  );
}
