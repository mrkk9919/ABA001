import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import Home from '@/pages/Home';
import Accounts from '@/pages/Accounts';
import AccountDetail from '@/pages/AccountDetail';
import TransactionDetail from '@/pages/TransactionDetail';
import Scanner from '@/pages/Scanner';
import PayFlow from '@/pages/PayFlow';
import TransferHub from '@/pages/TransferHub';
import Transfer from '@/pages/Transfer';
import Cards from '@/pages/Cards';
import Settings from '@/pages/Settings';
import SettingsFeatures from '@/pages/SettingsFeatures';
import Profile from '@/pages/Profile';
import ReceiveQr from '@/pages/ReceiveQr';
import Payments from '@/pages/Payments';
import InternationalTransfer from '@/pages/InternationalTransfer';
import EmoneyPay from '@/pages/EmoneyPay';
import Incoming from '@/pages/Incoming';
import Banks from '@/pages/Banks';
import Notifications from '@/pages/Notifications';
import Chat from '@/pages/Chat';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/scan" component={Scanner} />
      <Route path="/pay" component={PayFlow} />
      <Route path="/transfer" component={TransferHub} />
      <Route path="/transfer/send" component={Transfer} />
      <Route path="/accounts" component={Accounts} />
      <Route path="/cards" component={Cards} />
      <Route path="/settings" component={Settings} />
      <Route path="/settings/features" component={SettingsFeatures} />
      <Route path="/settings/profile" component={Profile} />
      <Route path="/receive" component={ReceiveQr} />
      <Route path="/payments" component={Payments} />
      <Route path="/international" component={InternationalTransfer} />
      <Route path="/emoney/pay" component={EmoneyPay} />
      <Route path="/incoming" component={Incoming} />
      <Route path="/banks" component={Banks} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/chat" component={Chat} />
      <Route path="/accounts/:id/tx/:txId" component={TransactionDetail} />
      <Route path="/accounts/:id" component={AccountDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

/* ─── Splash gate — shows the ABA Mobile splash photo on every launch.
   Tap anywhere (or wait 2.5s) to enter. Matches "installed app" feel. */
const SPLASH_IMG = `${import.meta.env.BASE_URL}splash.webp`;
function SplashGate({ onDone }: { onDone: () => void }) {
  return (
    <div
      onClick={onDone}
      className="fixed inset-0 z-[9999] bg-[#0F1B33] flex flex-col items-center justify-center cursor-pointer select-none"
    >
      <img
        src={SPLASH_IMG}
        alt="ABA Mobile"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      <div className="relative mt-auto mb-12 flex flex-col items-center gap-3">
        <div
          className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white"
          style={{ animation: 'splashSpin 0.9s linear infinite' }}
        />
        <p className="text-white/85 text-[13px] font-medium tracking-wide">
          ចុចដើម្បីចូល · Tap to enter
        </p>
      </div>
      <style>{`@keyframes splashSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function App() {
  const [splashDone, setSplashDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 2500);
    return () => clearTimeout(t);
  }, []);
  return (
    <>
      {!splashDone && <SplashGate onDone={() => setSplashDone(true)} />}
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </>
  );
}

export default App;