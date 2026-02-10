import TradingPage from '@/components/trade/TradingPage';

interface Props {
  params: Promise<{ pair?: string[] }>;
}

export default async function TradePage({ params }: Props) {
  const { pair } = await params;
  const currentPair = pair?.[0] || 'BTC-USDT';

  return <TradingPage pair={currentPair} />;
}
