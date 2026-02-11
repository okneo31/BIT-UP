import FuturesTradingPage from '@/components/futures/FuturesTradingPage';

interface Props {
  params: Promise<{ pair?: string[] }>;
}

export default async function FuturesPage({ params }: Props) {
  const { pair } = await params;
  const currentPair = pair?.[0] || 'BTCUSDT';

  return <FuturesTradingPage pair={currentPair} />;
}
