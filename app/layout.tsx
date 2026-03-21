import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { UserProvider } from '@/context/UserContext';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Pacepal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={dmSans.className}>
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
