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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
