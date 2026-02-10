import Header from '@/components/layout/Header';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />
      <main>{children}</main>
    </div>
  );
}
