import './globals.css';

export const metadata = {
  title: 'Streamer Rank',
  description: 'CHZZK & SOOP 실시간 통합 랭킹 플랫폼',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}