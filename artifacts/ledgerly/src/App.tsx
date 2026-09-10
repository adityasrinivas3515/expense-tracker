import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Redirect, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import {
  ClerkProvider,
  Show,
  SignIn,
  SignUp,
  useClerk,
  useUser,
} from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import {
  ArrowDownLeft, ArrowUpRight, BarChart3, Bell, CalendarDays, Check, ChevronDown, ChevronRight,
  CircleDollarSign, Download, FilePenLine, Filter, Home, Landmark, LayoutGrid, Menu, Plus,
  ReceiptIndianRupee, Search, Settings, Sparkles, Trash2, TrendingDown, TrendingUp, Wallet, X,
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';

type TxType = 'income' | 'expense';
type Transaction = { id: string; type: TxType; amount: number; category: string; description: string; date: string; paymentMethod: string };
type Budget = { monthly: number; categories: Record<string, number> };
type Currency = 'INR' | 'USD' | 'EUR' | 'GBP';

const seed: Transaction[] = [
  { id: 'tx-1', type: 'income', amount: 86500, category: 'Salary', description: 'April salary', date: '2025-04-01', paymentMethod: 'Bank transfer' },
  { id: 'tx-2', type: 'expense', amount: 1290, category: 'Groceries', description: 'Weekly provisions', date: '2025-04-03', paymentMethod: 'UPI' },
  { id: 'tx-3', type: 'expense', amount: 2200, category: 'Home', description: 'Electricity & internet', date: '2025-04-05', paymentMethod: 'Bank transfer' },
  { id: 'tx-4', type: 'expense', amount: 480, category: 'Dining', description: 'Dinner at Burma Burma', date: '2025-04-08', paymentMethod: 'Credit card' },
  { id: 'tx-5', type: 'expense', amount: 1800, category: 'Transport', description: 'Metro and cabs', date: '2025-04-10', paymentMethod: 'UPI' },
  { id: 'tx-6', type: 'income', amount: 12500, category: 'Freelance', description: 'Brand identity project', date: '2025-04-11', paymentMethod: 'Bank transfer' },
  { id: 'tx-7', type: 'expense', amount: 3500, category: 'Learning', description: 'Typography course', date: '2025-04-13', paymentMethod: 'Credit card' },
  { id: 'tx-8', type: 'expense', amount: 890, category: 'Wellness', description: 'Yoga studio', date: '2025-04-15', paymentMethod: 'UPI' },
  { id: 'tx-9', type: 'expense', amount: 2480, category: 'Shopping', description: 'Summer essentials', date: '2025-04-17', paymentMethod: 'Credit card' },
];
const categories = ['Salary', 'Freelance', 'Investments', 'Groceries', 'Home', 'Dining', 'Transport', 'Learning', 'Wellness', 'Shopping', 'Other'];
const methods = ['UPI', 'Credit card', 'Debit card', 'Bank transfer', 'Cash'];
const palette = ['#1e6255', '#da8750', '#d0a84b', '#7e9d8e', '#d36d5b', '#927aa6', '#5f8792'];
const defaultBudget: Budget = { monthly: 45000, categories: { Groceries: 9000, Home: 8500, Dining: 4500, Transport: 3500, Learning: 4000, Wellness: 2500, Shopping: 5000, Other: 3000 } };
const queryClient = new QueryClient();
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string) {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#1e6255',
    colorForeground: '#203f3a',
    colorMutedForeground: '#6a8179',
    colorDanger: '#ae4c3c',
    colorBackground: '#fffaf1',
    colorInput: '#faf6eb',
    colorInputForeground: '#203f3a',
    colorNeutral: '#ded8ca',
    fontFamily: 'DM Sans, sans-serif',
    borderRadius: '0.85rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#fffaf1] rounded-2xl w-[440px] max-w-full overflow-hidden border border-[#e5dfd1] shadow-[0_20px_70px_rgba(32,63,58,.12)]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'font-serif text-[#204d45]',
    headerSubtitle: 'text-[#6a8179]',
    socialButtonsBlockButtonText: 'text-[#355850]',
    formFieldLabel: 'text-[#506a62]',
    footerActionLink: 'text-[#1e6255] font-semibold',
    footerActionText: 'text-[#7a8d84]',
    dividerText: 'text-[#8a9990]',
    identityPreviewEditButton: 'text-[#1e6255]',
    formFieldSuccessText: 'text-[#1e6255]',
    alertText: 'text-[#ae4c3c]',
    logoBox: 'mb-2',
    logoImage: 'rounded-xl',
    socialButtonsBlockButton: 'border-[#ded8ca] bg-[#fcf8ef] hover:bg-[#f1ecdf]',
    formButtonPrimary: 'bg-[#1e6255] hover:bg-[#174c43] text-[#fff8eb]',
    formFieldInput: 'border-[#ded8ca] bg-[#fcf8ef] text-[#355850]',
    footerAction: 'border-t border-[#eee7da]',
    dividerLine: 'bg-[#e8e1d5]',
    alert: 'border-[#f0d7c2] bg-[#fae9dc]',
    otpCodeFieldInput: 'border-[#ded8ca] bg-[#fcf8ef]',
    formFieldRow: 'text-[#506a62]',
    main: 'px-2',
  },
};

function useLedger() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try { const raw = localStorage.getItem('ledgerly-transactions'); return raw ? JSON.parse(raw) : seed; } catch { return seed; }
  });
  const [budget, setBudget] = useState<Budget>(() => {
    try { const raw = localStorage.getItem('ledgerly-budget'); return raw ? JSON.parse(raw) : defaultBudget; } catch { return defaultBudget; }
  });
  const [currency, setCurrency] = useState<Currency>(() => (localStorage.getItem('ledgerly-currency') as Currency) || 'INR');
  useEffect(() => localStorage.setItem('ledgerly-transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('ledgerly-budget', JSON.stringify(budget)), [budget]);
  useEffect(() => localStorage.setItem('ledgerly-currency', currency), [currency]);
  return { transactions, setTransactions, budget, setBudget, currency, setCurrency };
}

function money(value: number, currency: Currency) {
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}
function compactMoney(value: number, currency: Currency) {
  if (value >= 100000) return `${currency === 'INR' ? '₹' : '$'}${(value / 100000).toFixed(1)}L`;
  return money(value, currency);
}
function formatDate(date: string) { return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(`${date}T12:00:00`)); }
function formatLongDate(date: string) { return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`)); }

function IconBadge({ category, type }: { category: string; type?: TxType }) {
  const icon = category === 'Salary' || category === 'Freelance' ? <TrendingUp size={16} /> : category === 'Home' ? <Landmark size={16} /> : category === 'Groceries' ? <ReceiptIndianRupee size={16} /> : category === 'Transport' ? <ArrowUpRight size={16} /> : <CircleDollarSign size={16} />;
  return <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${type === 'income' ? 'bg-[#dbeee5] text-[#1e6255]' : 'bg-[#fae9dc] text-[#b65d39]'}`}>{icon}</span>;
}

function Button({ children, variant = 'primary', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'soft' | 'danger' }) {
  const styles = { primary: 'bg-[#1e6255] text-[#fbf8f0] hover:bg-[#174c43] shadow-[0_5px_14px_rgba(30,98,85,.17)]', ghost: 'text-[#526b66] hover:bg-[#e8eee7]', soft: 'bg-[#e5efe9] text-[#1e6255] hover:bg-[#d8e9df]', danger: 'text-[#ae4c3c] hover:bg-[#fae3dd]' };
  return <button {...props} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();
  const displayName = user?.firstName || user?.username || 'Your';
  const initials = (user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0] || 'L').toUpperCase();
  const links = [
    { href: '/', label: 'Overview', icon: Home },
    { href: '/transactions', label: 'Transactions', icon: ReceiptIndianRupee },
    { href: '/reports', label: 'Reports', icon: BarChart3 },
    { href: '/budget', label: 'Budget plan', icon: LayoutGrid },
  ];
  return <div className="grain min-h-[100dvh] bg-[#f4f1e9] text-[#203f3a]">
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[246px] flex-col border-r border-[#dce2d8] bg-[#eef2ea] px-5 py-7 transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="mb-12 flex items-center justify-between px-2"><Link href="/" className="flex items-center gap-3" data-testid="link-logo"><span className="flex h-9 w-9 rotate-[-7deg] items-center justify-center rounded-xl bg-[#1e6255] text-[#f8f5ea]"><Wallet size={18} /></span><span className="font-serif text-2xl italic tracking-tight text-[#204f47]">Ledgerly</span></Link><button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={18} /></button></div>
      <p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[.18em] text-[#84958e]">Your money, in focus</p>
      <nav className="space-y-1.5">{links.map(({ href, label, icon: NavIcon }) => <Link key={href} href={href} onClick={() => setOpen(false)} data-testid={`link-nav-${label.toLowerCase().replace(' ', '-')}`} className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${location === href ? 'bg-[#dcebe1] text-[#1e6255]' : 'text-[#647973] hover:bg-[#e5ece3] hover:text-[#1e6255]'}`}><NavIcon size={18} strokeWidth={location === href ? 2.4 : 1.8} /><span>{label}</span>{location === href && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#d98754]" />}</Link>)}</nav>
      <div className="mt-auto space-y-1.5"><Link href="/settings" onClick={() => setOpen(false)} data-testid="link-nav-settings" className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${location === '/settings' ? 'bg-[#dcebe1] text-[#1e6255]' : 'text-[#647973] hover:bg-[#e5ece3]'}`}><Settings size={18} /><span>Settings</span></Link><div className="mt-5 rounded-2xl bg-[#dcebe1] p-4"><div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#f8f5ea] text-xs font-bold text-[#1e6255]">{initials}</div><p className="text-sm font-bold text-[#204f47]">{displayName}'s space</p><p className="mt-1 text-xs leading-5 text-[#6c837a]">A quiet corner for better money habits.</p><button type="button" onClick={() => signOut({ redirectUrl: basePath || '/' })} className="mt-3 text-xs font-bold text-[#1e6255] hover:underline">Sign out</button></div></div>
    </aside>
    {open && <button className="fixed inset-0 z-30 bg-[#173a34]/20 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu overlay" />}
    <div className="min-h-[100dvh] lg:pl-[246px]"><header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-[#e1e4db]/80 bg-[#f4f1e9]/90 px-5 backdrop-blur-md sm:px-8 lg:px-12"><button className="rounded-lg p-2 text-[#526b66] hover:bg-[#e8eee7] lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={21} /></button><div className="hidden items-center gap-2 text-sm text-[#768983] sm:flex"><span className="h-2 w-2 rounded-full bg-[#d98754]" /> <span>Saturday, 19 April 2025</span></div><div className="ml-auto flex items-center gap-4"><button className="relative rounded-xl p-2 text-[#668079] hover:bg-[#e7ece4]" aria-label="Notifications"><Bell size={19} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#d98754]" /></button><span className="hidden h-7 w-px bg-[#dce2d8] sm:block" /><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d98754] text-xs font-bold text-[#fff8eb]">AR</span></div></header><main className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:px-12 lg:py-10">{children}</main></div>
  </div>;
}

function PageIntro({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy: string; action?: React.ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-[#d1784c]">{eyebrow}</p><h1 className="font-serif text-[2.7rem] leading-none tracking-[-.03em] text-[#204d45] sm:text-5xl">{title}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[#6a8179]">{copy}</p></div>{action}</div>;
}
function StatCard({ label, value, note, tone = 'cream', icon }: { label: string; value: string; note: string; tone?: 'cream' | 'green' | 'orange'; icon: React.ReactNode }) {
  const styles = { cream: 'bg-[#fffaf1] border-[#eadfca]', green: 'bg-[#e3efe8] border-[#d1e3d8]', orange: 'bg-[#fae9dc] border-[#f0d7c2]' };
  return <div className={`card-shadow rounded-2xl border p-5 ${styles[tone]}`}><div className="mb-5 flex items-start justify-between"><p className="text-xs font-semibold uppercase tracking-[.08em] text-[#6b817a]">{label}</p><span className="text-[#719086]">{icon}</span></div><p className="font-mono text-2xl font-medium tracking-[-.04em] text-[#234b43] sm:text-[1.7rem]">{value}</p><p className="mt-2 text-xs text-[#789087]">{note}</p></div>;
}

function Overview({ ledger }: { ledger: ReturnType<typeof useLedger> }) {
  const { transactions, budget, currency } = ledger;
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const spent = transactions.filter(t => t.type === 'expense' && t.date.startsWith('2025-04')).reduce((s, t) => s + t.amount, 0);
  const categoryTotals = categories.map(category => ({ category, value: transactions.filter(t => t.type === 'expense' && t.category === category).reduce((s, t) => s + t.amount, 0) })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  return <><PageIntro eyebrow="Saturday, 19 April" title="Good morning, Aarav." copy="A clear view of your money today. You are building a thoughtful rhythm." action={<Link href="/add" data-testid="link-add-transaction"><Button><Plus size={17} /> Add transaction</Button></Link>} />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
      { label: 'Total balance', value: money(income - expenses, currency), note: 'Across all accounts', tone: 'green' as const, icon: <Wallet size={19} /> },
      { label: 'Income this month', value: money(income, currency), note: '↑ 8.4% from March', tone: 'cream' as const, icon: <ArrowDownLeft size={19} /> },
      { label: 'Spent this month', value: money(spent, currency), note: `${Math.round((spent / budget.monthly) * 100)}% of your monthly plan`, tone: 'orange' as const, icon: <ArrowUpRight size={19} /> },
      { label: 'You are on track', value: money(Math.max(budget.monthly - spent, 0), currency), note: 'left in your monthly plan', tone: 'cream' as const, icon: <Sparkles size={19} /> },
    ].map(card => <StatCard key={card.label} {...card} />)}</section>
    <section className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_1fr]"><div className="card-shadow rounded-2xl border border-[#e5dfd1] bg-[#fffaf1] p-5 sm:p-6"><div className="mb-6 flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#d1784c]">Spending pulse</p><h2 className="mt-1 text-lg font-bold text-[#254c44]">Monthly spending</h2></div><span className="rounded-lg bg-[#f2eadb] px-2.5 py-1.5 text-xs font-semibold text-[#7b8170]">April 2025 <ChevronDown size={13} className="ml-1 inline" /></span></div><div className="h-[235px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={[{day:'01',amount:2200},{day:'05',amount:3490},{day:'08',amount:3970},{day:'12',amount:9270},{day:'15',amount:10160},{day:'19',amount:15810},{day:'23',amount:15810},{day:'27',amount:15810},{day:'30',amount:15810}]}><defs><linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1e6255" stopOpacity=".23" /><stop offset="100%" stopColor="#1e6255" stopOpacity=".01" /></linearGradient></defs><CartesianGrid stroke="#e9e1d5" strokeDasharray="3 4" vertical={false} /><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#87968d', fontSize: 11 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: '#87968d', fontSize: 11 }} tickFormatter={v => `₹${v / 1000}k`} width={40} /><Tooltip contentStyle={{ border: '1px solid #e0d7c7', borderRadius: 12, background: '#fffaf1', fontSize: 12 }} formatter={(v: number) => [money(v, currency), 'Spent']} /><Area type="monotone" dataKey="amount" stroke="#1e6255" strokeWidth={2.5} fill="url(#areaFill)" /></AreaChart></ResponsiveContainer></div><div className="mt-3 flex items-center gap-2 text-xs text-[#758981]"><span className="h-2 w-2 rounded-full bg-[#d98754]" /> Lower than your April pace by 12.6%</div></div>
      <div className="card-shadow rounded-2xl border border-[#d6e3db] bg-[#e8f1ea] p-5 sm:p-6"><div className="mb-6 flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#d1784c]">Your plan</p><h2 className="mt-1 text-lg font-bold text-[#254c44]">Budget progress</h2></div><Link href="/budget" className="text-xs font-bold text-[#1e6255] hover:underline" data-testid="link-view-budget">Manage</Link></div><div className="relative mx-auto mb-6 flex h-36 w-36 items-center justify-center rounded-full" style={{ background: `conic-gradient(#1e6255 ${Math.min((spent / budget.monthly) * 100, 100)}%, #d5e1d7 0)` }}><div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-[#e8f1ea]"><span className="font-mono text-2xl text-[#204d45]">{Math.round((spent / budget.monthly) * 100)}%</span><span className="text-[10px] uppercase tracking-wider text-[#71877d]">used</span></div></div><div className="flex items-end justify-between border-t border-[#d5e2d8] pt-4"><div><p className="text-xs text-[#71877d]">Spent</p><p className="mt-1 font-mono font-medium text-[#29584d]">{money(spent, currency)}</p></div><div className="text-right"><p className="text-xs text-[#71877d]">Plan</p><p className="mt-1 font-mono font-medium text-[#29584d]">{money(budget.monthly, currency)}</p></div></div></div></section>
    <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.45fr]"><div className="card-shadow rounded-2xl border border-[#e5dfd1] bg-[#fffaf1] p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#d1784c]">Where it went</p><h2 className="mt-1 text-lg font-bold text-[#254c44]">Top categories</h2></div><Link href="/reports" className="text-xs font-bold text-[#1e6255]" data-testid="link-see-reports">See reports <ChevronRight size={13} className="inline" /></Link></div>{categoryTotals.slice(0, 4).map((item, i) => <div key={item.category} className="mb-4"><div className="mb-1.5 flex justify-between text-xs"><span className="font-semibold text-[#506963]">{item.category}</span><span className="font-mono text-[#74887f]">{money(item.value, currency)}</span></div><div className="h-2 overflow-hidden rounded-full bg-[#eee7d9]"><div className="h-full rounded-full" style={{ width: `${Math.min((item.value / spent) * 100 * 1.5, 100)}%`, background: palette[i] }} /></div></div>)}</div>
      <div className="card-shadow rounded-2xl border border-[#e5dfd1] bg-[#fffaf1] p-5 sm:p-6"><div className="mb-4 flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#d1784c]">Latest movement</p><h2 className="mt-1 text-lg font-bold text-[#254c44]">Recent activity</h2></div><Link href="/transactions" className="text-xs font-bold text-[#1e6255]" data-testid="link-all-transactions">All activity <ChevronRight size={13} className="inline" /></Link></div><div className="divide-y divide-[#eee7da]">{recent.map(tx => <div key={tx.id} className="flex items-center gap-3 py-3"><IconBadge category={tx.category} type={tx.type} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#355850]">{tx.description}</p><p className="mt-0.5 text-xs text-[#8a9990]">{tx.category} · {formatDate(tx.date)}</p></div><p className={`font-mono text-sm font-medium ${tx.type === 'income' ? 'text-[#1e6255]' : 'text-[#a45740]'}`}>{tx.type === 'income' ? '+' : '−'}{money(tx.amount, currency)}</p></div>)}</div></div></section>
  </>;
}

function Transactions({ ledger }: { ledger: ReturnType<typeof useLedger> }) {
  const { transactions, setTransactions, currency } = ledger;
  const [query, setQuery] = useState(''); const [type, setType] = useState('all'); const [category, setCategory] = useState('all'); const [sort, setSort] = useState<'date' | 'amount'>('date');
  const [toast, setToast] = useState('');
  const filtered = useMemo(() => transactions.filter(t => (type === 'all' || t.type === type) && (category === 'all' || t.category === category) && `${t.description} ${t.category} ${t.paymentMethod}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === 'date' ? b.date.localeCompare(a.date) : b.amount - a.amount), [transactions, query, type, category, sort]);
  const remove = (id: string) => { setTransactions(prev => prev.filter(t => t.id !== id)); setToast('Transaction removed'); setTimeout(() => setToast(''), 2200); };
  return <><PageIntro eyebrow="Your ledger" title="Transactions" copy="Every rupee has a story. Search, review, and keep your record honest." action={<Link href="/add" data-testid="link-add-from-transactions"><Button><Plus size={17} /> Add transaction</Button></Link>} />
    <div className="card-shadow rounded-2xl border border-[#e5dfd1] bg-[#fffaf1] p-4 sm:p-6"><div className="flex flex-col gap-3 lg:flex-row"><label className="relative flex-1"><Search size={17} className="absolute left-3.5 top-3 text-[#8a9a91]" /><input data-testid="input-search-transactions" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search transactions..." className="h-11 w-full rounded-xl border border-[#e1d9cb] bg-[#faf6eb] pl-10 pr-3 text-sm outline-none transition focus:border-[#80aa97] focus:ring-2 focus:ring-[#bddcc9]" /></label><div className="flex flex-wrap gap-2"><select data-testid="select-transaction-type" value={type} onChange={e => setType(e.target.value)} className="h-11 rounded-xl border border-[#e1d9cb] bg-[#faf6eb] px-3 text-sm text-[#5d756d] outline-none"><option value="all">All types</option><option value="income">Income</option><option value="expense">Expenses</option></select><select data-testid="select-transaction-category" value={category} onChange={e => setCategory(e.target.value)} className="h-11 rounded-xl border border-[#e1d9cb] bg-[#faf6eb] px-3 text-sm text-[#5d756d] outline-none"><option value="all">All categories</option>{categories.map(c => <option key={c}>{c}</option>)}</select><button data-testid="button-sort-transactions" onClick={() => setSort(sort === 'date' ? 'amount' : 'date')} className="flex h-11 items-center gap-2 rounded-xl border border-[#e1d9cb] px-3 text-xs font-semibold text-[#5d756d] hover:bg-[#f1ecdf]"><Filter size={15} /> Sort by {sort}</button></div></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead><tr className="border-b border-[#eee7d9] text-[10px] uppercase tracking-[.14em] text-[#94a097]"><th className="pb-3 pl-2">Description</th><th className="pb-3">Category</th><th className="pb-3">Date</th><th className="pb-3">Method</th><th className="pb-3 text-right">Amount</th><th className="pb-3 text-right"> </th></tr></thead><tbody>{filtered.map((tx, i) => <tr key={tx.id} data-testid={`row-transaction-${tx.id}`} className="group border-b border-[#f0eadf] transition hover:bg-[#fcf7ed]"><td className="py-4 pl-2"><div className="flex items-center gap-3"><IconBadge category={tx.category} type={tx.type} /><div><p className="text-sm font-semibold text-[#355850]">{tx.description}</p><p className="mt-0.5 text-xs text-[#93a098]">{tx.type === 'income' ? 'Money in' : 'Money out'}</p></div></div></td><td className="py-4 text-sm text-[#657a72]">{tx.category}</td><td className="py-4 text-sm text-[#657a72]">{formatLongDate(tx.date)}</td><td className="py-4 text-sm text-[#657a72]">{tx.paymentMethod}</td><td className={`py-4 text-right font-mono text-sm font-medium ${tx.type === 'income' ? 'text-[#1e6255]' : 'text-[#a45740]'}`}>{tx.type === 'income' ? '+' : '−'}{money(tx.amount, currency)}</td><td className="py-4 text-right"><span className="invisible flex justify-end gap-1 group-hover:visible"><Link href={`/add?edit=${tx.id}`} data-testid={`link-edit-${tx.id}`} className="rounded-lg p-2 text-[#668079] hover:bg-[#e6eee8]"><FilePenLine size={15} /></Link><button data-testid={`button-delete-${tx.id}`} onClick={() => remove(tx.id)} className="rounded-lg p-2 text-[#ae6b5a] hover:bg-[#fae3dd]"><Trash2 size={15} /></button></span></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7efe8] text-[#1e6255]"><Search size={20} /></div><h3 className="mt-4 font-serif text-2xl text-[#355850]">No transactions found</h3><p className="mt-1 text-sm text-[#7a8c84]">Try a different search or add a new entry.</p></div>}</div></div>
    {toast && <div className="fixed bottom-6 right-6 z-50 flex animate-slide items-center gap-2 rounded-xl bg-[#204f47] px-4 py-3 text-sm font-semibold text-[#fffaf1] shadow-xl"><Check size={16} />{toast}</div>}</>;
}

function AddTransaction({ ledger }: { ledger: ReturnType<typeof useLedger> }) {
  const [, navigate] = useLocation(); const [location] = useLocation(); const editId = new URLSearchParams(location.split('?')[1] || '').get('edit'); const existing = ledger.transactions.find(t => t.id === editId);
  const [form, setForm] = useState({ type: existing?.type || 'expense' as TxType, amount: existing?.amount?.toString() || '', category: existing?.category || 'Groceries', description: existing?.description || '', date: existing?.date || '2025-04-19', paymentMethod: existing?.paymentMethod || 'UPI' }); const [saved, setSaved] = useState(false);
  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!form.amount || Number(form.amount) <= 0 || !form.description.trim()) return; const item: Transaction = { id: existing?.id || `tx-${Date.now()}`, type: form.type as TxType, amount: Number(form.amount), category: form.category, description: form.description.trim(), date: form.date, paymentMethod: form.paymentMethod }; ledger.setTransactions(prev => existing ? prev.map(t => t.id === existing.id ? item : t) : [item, ...prev]); setSaved(true); setTimeout(() => navigate('/transactions'), 600); };
  return <div className="mx-auto max-w-3xl"><PageIntro eyebrow={existing ? 'Edit entry' : 'New entry'} title={existing ? 'Refine the details.' : 'Make a note of it.'} copy={existing ? 'Small corrections keep your financial picture clear.' : 'A few intentional seconds now makes future-you grateful.'} /><form onSubmit={submit} className="card-shadow rounded-2xl border border-[#e5dfd1] bg-[#fffaf1] p-5 sm:p-8"><div className="mb-7 grid grid-cols-2 rounded-xl bg-[#eee9dc] p-1"><button type="button" data-testid="button-type-expense" onClick={() => update('type', 'expense')} className={`rounded-lg py-3 text-sm font-bold transition ${form.type === 'expense' ? 'bg-[#fffaf1] text-[#a45740] shadow-sm' : 'text-[#87938a]'}`}><ArrowUpRight size={16} className="mr-2 inline" />Expense</button><button type="button" data-testid="button-type-income" onClick={() => update('type', 'income')} className={`rounded-lg py-3 text-sm font-bold transition ${form.type === 'income' ? 'bg-[#fffaf1] text-[#1e6255] shadow-sm' : 'text-[#87938a]'}`}><ArrowDownLeft size={16} className="mr-2 inline" />Income</button></div><div className="mb-7 rounded-2xl bg-[#e7f0e9] p-5"><label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#69837a]">Amount</label><div className="flex items-center gap-3"><span className="font-serif text-4xl text-[#1e6255]">{ledger.currency === 'INR' ? '₹' : ledger.currency}</span><input autoFocus data-testid="input-amount" required type="number" min="1" step="1" value={form.amount} onChange={e => update('amount', e.target.value)} placeholder="0" className="w-full bg-transparent font-mono text-4xl tracking-tight text-[#204f47] outline-none placeholder:text-[#a7beb0]" /></div></div><div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-semibold text-[#506a62]">Description<input data-testid="input-description" required value={form.description} onChange={e => update('description', e.target.value)} placeholder="What was this for?" className="mt-2 h-12 w-full rounded-xl border border-[#ded8ca] bg-[#fcf8ef] px-4 text-sm font-normal text-[#355850] outline-none focus:border-[#80aa97] focus:ring-2 focus:ring-[#bddcc9]" /></label><label className="text-sm font-semibold text-[#506a62]">Category<select data-testid="select-category" value={form.category} onChange={e => update('category', e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#ded8ca] bg-[#fcf8ef] px-4 text-sm font-normal text-[#355850] outline-none focus:border-[#80aa97]">{categories.map(c => <option key={c}>{c}</option>)}</select></label><label className="text-sm font-semibold text-[#506a62]">Date<input data-testid="input-date" required type="date" value={form.date} onChange={e => update('date', e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#ded8ca] bg-[#fcf8ef] px-4 text-sm font-normal text-[#355850] outline-none focus:border-[#80aa97]" /></label><label className="text-sm font-semibold text-[#506a62]">Payment method<select data-testid="select-payment-method" value={form.paymentMethod} onChange={e => update('paymentMethod', e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#ded8ca] bg-[#fcf8ef] px-4 text-sm font-normal text-[#355850] outline-none focus:border-[#80aa97]">{methods.map(m => <option key={m}>{m}</option>)}</select></label></div><div className="mt-8 flex flex-col-reverse justify-end gap-3 sm:flex-row"><Link href="/transactions" data-testid="link-cancel-transaction"><Button type="button" variant="ghost">Cancel</Button></Link><Button data-testid="button-save-transaction" type="submit">{saved ? <><Check size={16} /> Saved</> : <>{existing ? 'Save changes' : 'Save transaction'} <ChevronRight size={16} /></>}</Button></div></form></div>;
}

function Reports({ ledger }: { ledger: ReturnType<typeof useLedger> }) {
  const { transactions, currency } = ledger; const expenses = transactions.filter(t => t.type === 'expense'); const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0); const expenseTotal = expenses.reduce((s, t) => s + t.amount, 0);
  const breakdown = categories.map((category, i) => ({ name: category, value: expenses.filter(t => t.category === category).reduce((s, t) => s + t.amount, 0), color: palette[i % palette.length] })).filter(x => x.value > 0);
  const monthly = [{ month: 'Jan', income: 62000, expense: 38900 }, { month: 'Feb', income: 74000, expense: 42100 }, { month: 'Mar', income: 79800, expense: 35200 }, { month: 'Apr', income, expense: expenseTotal }];
  return <><PageIntro eyebrow="Patterns, not pressure" title="Reports" copy="Notice what your money is teaching you. Trends are useful when they feel human." action={<Button variant="soft"><Download size={16} /> Export view</Button>} /><div className="grid gap-6 xl:grid-cols-[1fr_1.5fr]"><div className="card-shadow rounded-2xl border border-[#e5dfd1] bg-[#fffaf1] p-5 sm:p-6"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#d1784c]">The shape of spending</p><h2 className="mt-1 text-lg font-bold text-[#254c44]">Category breakdown</h2><div className="relative mx-auto mt-5 h-64 max-w-[280px]"><ResponsiveContainer><PieChart><Pie data={breakdown} dataKey="value" nameKey="name" innerRadius={72} outerRadius={104} paddingAngle={3} stroke="none">{breakdown.map(d => <Cell key={d.name} fill={d.color} />)}</Pie><Tooltip formatter={(v: number) => money(v, currency)} contentStyle={{ borderRadius: 12, border: '1px solid #e0d7c7', background: '#fffaf1', fontSize: 12 }} /></PieChart></ResponsiveContainer><div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className="font-mono text-xl text-[#254c44]">{money(expenseTotal, currency)}</span><span className="text-[10px] uppercase tracking-wider text-[#8a978e]">total out</span></div></div><div className="space-y-3">{breakdown.map(d => <div key={d.name} className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-[#5c736b]"><span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />{d.name}</span><span className="font-mono text-xs text-[#5d756c]">{money(d.value, currency)}</span></div>)}</div></div><div className="card-shadow rounded-2xl border border-[#d6e3db] bg-[#e8f1ea] p-5 sm:p-6"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#d1784c]">A gentler comparison</p><h2 className="mt-1 text-lg font-bold text-[#254c44]">Income vs expenses</h2><div className="mt-5 h-[270px]"><ResponsiveContainer><BarChart data={monthly} barGap={8}><CartesianGrid stroke="#d5e2d7" strokeDasharray="3 4" vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#71877d', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#71877d', fontSize: 11 }} tickFormatter={v => `₹${v / 1000}k`} /><Tooltip cursor={{ fill: '#dcebe1' }} contentStyle={{ borderRadius: 12, border: '1px solid #c8dbcf', background: '#f7fbf5', fontSize: 12 }} formatter={(v: number) => money(v, currency)} /><Bar dataKey="income" fill="#1e6255" radius={[5, 5, 0, 0]} /><Bar dataKey="expense" fill="#d98754" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div><div className="mt-1 flex gap-4 text-xs text-[#71877d]"><span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#1e6255]" />Income</span><span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#d98754]" />Expenses</span></div></div></div><div className="card-shadow mt-6 rounded-2xl border border-[#e5dfd1] bg-[#fffaf1] p-5 sm:p-6"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#d1784c]">The longer view</p><h2 className="mt-1 text-lg font-bold text-[#254c44]">Monthly expense trend</h2><div className="mt-5 h-[260px]"><ResponsiveContainer><AreaChart data={monthly}><defs><linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d98754" stopOpacity=".2" /><stop offset="100%" stopColor="#d98754" stopOpacity="0" /></linearGradient></defs><CartesianGrid stroke="#e9e1d5" strokeDasharray="3 4" vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#87968d', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#87968d', fontSize: 11 }} tickFormatter={v => `₹${v / 1000}k`} /><Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e0d7c7', background: '#fffaf1', fontSize: 12 }} formatter={(v: number) => money(v, currency)} /><Area type="monotone" dataKey="expense" stroke="#d98754" fill="url(#expenseFill)" strokeWidth={2.5} /></AreaChart></ResponsiveContainer></div></div></>;
}

function Budget({ ledger }: { ledger: ReturnType<typeof useLedger> }) {
  const { budget, setBudget, transactions, currency } = ledger; const [draft, setDraft] = useState(budget); const [saved, setSaved] = useState(false); const expenses = transactions.filter(t => t.type === 'expense'); const spent = expenses.reduce((s, t) => s + t.amount, 0);
  const byCategory = (c: string) => expenses.filter(t => t.category === c).reduce((s, t) => s + t.amount, 0);
  const save = (e: React.FormEvent) => { e.preventDefault(); setBudget(draft); setSaved(true); setTimeout(() => setSaved(false), 1800); };
  return <><PageIntro eyebrow="Make room for what matters" title="Budget plan" copy="Give each part of your life a little shape. A plan is a permission slip, not a punishment." /><form onSubmit={save}><div className="grid gap-6 xl:grid-cols-[.85fr_1.15fr]"><div className="card-shadow rounded-2xl border border-[#d6e3db] bg-[#e8f1ea] p-6 sm:p-8"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#d1784c]">April 2025</p><h2 className="mt-1 font-serif text-3xl text-[#254c44]">Your monthly intention</h2><p className="mt-3 text-sm leading-6 text-[#6d837a]">Set one number that gives the month a gentle boundary.</p><label className="mt-8 block text-sm font-semibold text-[#506a62]">Monthly spending plan<div className="mt-2 flex items-center rounded-xl border border-[#cdded2] bg-[#f4f9f2] px-4"><span className="font-serif text-2xl text-[#1e6255]">₹</span><input data-testid="input-monthly-budget" type="number" min="0" value={draft.monthly} onChange={e => setDraft({ ...draft, monthly: Number(e.target.value) })} className="h-14 w-full bg-transparent px-3 font-mono text-2xl text-[#204f47] outline-none" /></div></label><div className="mt-8 border-t border-[#d2e0d5] pt-5"><div className="flex justify-between text-sm"><span className="text-[#71877d]">Current progress</span><span className="font-mono text-[#1e6255]">{Math.round((spent / draft.monthly) * 100)}%</span></div><div className="mt-3 h-2.5 rounded-full bg-[#ceded2]"><div className="h-full rounded-full bg-[#1e6255] transition-all" style={{ width: `${Math.min((spent / draft.monthly) * 100, 100)}%` }} /></div><p className="mt-3 text-xs text-[#71877d]">{money(spent, currency)} spent of {money(draft.monthly, currency)}</p></div><Button data-testid="button-save-budget" type="submit" className="mt-8 w-full">{saved ? <><Check size={16} /> Plan saved</> : 'Save monthly plan'}</Button></div><div className="card-shadow rounded-2xl border border-[#e5dfd1] bg-[#fffaf1] p-6 sm:p-8"><div className="mb-5 flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#d1784c]">Category guardrails</p><h2 className="mt-1 text-lg font-bold text-[#254c44]">Where the plan lives</h2></div><span className="text-xs text-[#8a9990]">Set in ₹</span></div><div className="space-y-5">{Object.entries(draft.categories).map(([category, limit]) => { const value = byCategory(category); const pct = limit ? (value / limit) * 100 : 0; return <div key={category}><div className="mb-2 flex justify-between"><label className="text-sm font-semibold text-[#526b63]">{category}<span className="ml-2 text-xs font-normal text-[#95a098]">{money(value, currency)} used</span></label><input data-testid={`input-budget-${category.toLowerCase()}`} type="number" value={limit} onChange={e => setDraft({ ...draft, categories: { ...draft.categories, [category]: Number(e.target.value) } })} className="w-24 border-b border-[#d9d3c6] bg-transparent text-right font-mono text-xs text-[#567168] outline-none focus:border-[#1e6255]" /></div><div className="h-2 overflow-hidden rounded-full bg-[#eee7d9]"><div className={`h-full rounded-full transition-all ${pct > 100 ? 'bg-[#c96752]' : 'bg-[#6f9c86]'}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div></div> })}</div></div></div></form></>;
}

function SettingsPage({ ledger }: { ledger: ReturnType<typeof useLedger> }) {
  const [saved, setSaved] = useState(false); const [confirm, setConfirm] = useState(false);
  const saveCurrency = (v: Currency) => { ledger.setCurrency(v); setSaved(true); setTimeout(() => setSaved(false), 1600); };
  const clear = () => { ledger.setTransactions([]); setConfirm(false); };
  return <><PageIntro eyebrow="A space that is yours" title="Settings" copy="Keep Ledgerly feeling like your place. Your data stays on this device." /><div className="mx-auto max-w-3xl space-y-6"><section className="card-shadow rounded-2xl border border-[#e5dfd1] bg-[#fffaf1] p-6 sm:p-8"><div className="flex items-start gap-4"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e3efe8] text-[#1e6255]"><CircleDollarSign size={21} /></span><div><h2 className="font-bold text-[#254c44]">Display currency</h2><p className="mt-1 text-sm text-[#7a8d84]">Choose how amounts are shown throughout your ledger.</p></div></div><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{(['INR', 'USD', 'EUR', 'GBP'] as Currency[]).map(c => <button key={c} data-testid={`button-currency-${c}`} onClick={() => saveCurrency(c)} className={`rounded-xl border p-4 text-left transition ${ledger.currency === c ? 'border-[#77a890] bg-[#e5f0e8] text-[#1e6255]' : 'border-[#e2dbce] bg-[#fcf8ef] text-[#71827b] hover:border-[#b9cfc2]'}`}><span className="block font-mono text-lg">{c === 'INR' ? '₹' : c === 'USD' ? '$' : c === 'EUR' ? '€' : '£'}</span><span className="mt-2 block text-xs font-bold">{c}</span>{ledger.currency === c && <Check size={15} className="mt-2" />}</button>)}</div>{saved && <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#1e6255]"><Check size={14} /> Currency preference saved</p>}</section><section className="card-shadow rounded-2xl border border-[#e5dfd1] bg-[#fffaf1] p-6 sm:p-8"><div className="flex items-start gap-4"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fae9dc] text-[#ae6548]"><Download size={21} /></span><div><h2 className="font-bold text-[#254c44]">Your local data</h2><p className="mt-1 text-sm leading-6 text-[#7a8d84]">Ledgerly stores everything in your browser's local storage. Nothing leaves this device.</p></div></div><div className="mt-6 flex flex-col gap-3 border-t border-[#eee7da] pt-5 sm:flex-row"><Button variant="soft" onClick={() => { const blob = new Blob([JSON.stringify({ transactions: ledger.transactions, budget: ledger.budget }, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ledgerly-backup.json'; a.click(); }} data-testid="button-export-data"><Download size={16} /> Export a backup</Button>{confirm ? <div className="flex items-center gap-2"><span className="text-xs text-[#a45740]">Clear all transactions?</span><Button variant="danger" onClick={clear} data-testid="button-confirm-clear">Yes, clear</Button><Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button></div> : <Button variant="danger" onClick={() => setConfirm(true)} data-testid="button-clear-data"><Trash2 size={16} /> Clear transaction data</Button>}</div></section><div className="flex items-center justify-center gap-2 py-4 text-xs text-[#8a9990]"><Sparkles size={13} className="text-[#d98754]" /> Made for a calmer money ritual</div></div></>;
}

function LandingPage() {
  return <div className="grain flex min-h-[100dvh] items-center justify-center bg-[#f4f1e9] px-5 py-10 text-[#203f3a]">
    <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-[#dce2d8] bg-[#eef2ea] shadow-[0_25px_90px_rgba(32,63,58,.12)] md:grid-cols-[1.05fr_.95fr]">
      <div className="flex flex-col justify-between p-7 sm:p-12">
        <div><div className="flex items-center gap-3"><span className="flex h-10 w-10 rotate-[-7deg] items-center justify-center rounded-xl bg-[#1e6255] text-[#f8f5ea]"><Wallet size={19} /></span><span className="font-serif text-2xl italic tracking-tight text-[#204f47]">Ledgerly</span></div><p className="mt-20 font-mono text-[10px] uppercase tracking-[.2em] text-[#d1784c]">A calmer money ritual</p><h1 className="mt-3 max-w-lg font-serif text-5xl leading-[.98] tracking-[-.04em] text-[#204d45] sm:text-6xl">Make space for what matters.</h1><p className="mt-5 max-w-md text-sm leading-6 text-[#6a8179]">A thoughtful place to understand your spending, keep your plans visible, and feel more in control of your money.</p></div>
        <p className="mt-16 text-xs text-[#82918a]">Private by design · Your ledger stays yours</p>
      </div>
      <div className="flex flex-col justify-center bg-[#fffaf1] p-7 sm:p-12"><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#d1784c]">Welcome to your ledger</p><h2 className="mt-3 font-serif text-3xl text-[#204d45]">Start with one good habit.</h2><p className="mt-3 text-sm leading-6 text-[#6a8179]">Create an account to keep your dashboard and money habits available whenever you return.</p><div className="mt-8 grid gap-3"><Link href="/sign-up" className="flex h-12 items-center justify-center rounded-xl bg-[#1e6255] text-sm font-bold text-[#fff8eb] shadow-[0_5px_14px_rgba(30,98,85,.17)] transition hover:bg-[#174c43]" data-testid="link-sign-up">Create your account <ChevronRight size={16} className="ml-1" /></Link><Link href="/sign-in" className="flex h-12 items-center justify-center rounded-xl border border-[#d9d3c6] bg-[#fcf8ef] text-sm font-bold text-[#1e6255] transition hover:bg-[#f1ecdf]" data-testid="link-sign-in">Sign in to Ledgerly</Link></div><div className="mt-8 flex items-center gap-3 border-t border-[#eee7da] pt-5 text-xs text-[#8a9990]"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e3efe8] text-[#1e6255]"><Check size={14} /></span><span>Simple, private, and built for your everyday money.</span></div></div>
    </div>
  </div>;
}

function SignInPage() {
  return <div className="grain flex min-h-[100dvh] items-center justify-center bg-[#f4f1e9] px-4 py-8"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>;
}

function SignUpPage() {
  return <div className="grain flex min-h-[100dvh] items-center justify-center bg-[#f4f1e9] px-4 py-8"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>;
}

function HomeRedirect() {
  return <><Show when="signed-in"><Redirect to="/user-portal" /></Show><Show when="signed-out"><LandingPage /></Show></>;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const previousUserId = useRef<string | null | undefined>(undefined);
  useEffect(() => addListener(({ user }) => {
    const nextUserId = user?.id ?? null;
    if (previousUserId.current !== undefined && previousUserId.current !== nextUserId) queryClient.clear();
    previousUserId.current = nextUserId;
  }), [addListener]);
  return null;
}

function AuthenticatedApp() {
  const ledger = useLedger();
  return <><Show when="signed-in"><Switch><Route path="/user-portal"><Shell><Overview ledger={ledger} /></Shell></Route><Route path="/transactions"><Shell><Transactions ledger={ledger} /></Shell></Route><Route path="/add"><Shell><AddTransaction ledger={ledger} /></Shell></Route><Route path="/reports"><Shell><Reports ledger={ledger} /></Shell></Route><Route path="/budget"><Shell><Budget ledger={ledger} /></Shell></Route><Route path="/settings"><Shell><SettingsPage ledger={ledger} /></Shell></Route><Route component={NotFound} /></Switch></Show><Show when="signed-out"><Redirect to="/" /></Show></>;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={clerkAppearance} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} localization={{ signIn: { start: { title: 'Welcome back', subtitle: 'Sign in to access your ledger' } }, signUp: { start: { title: 'Create your account', subtitle: 'Start your calmer money ritual' } } }} routerPush={(to) => setLocation(stripBase(to))} routerReplace={(to) => setLocation(stripBase(to), { replace: true })}>
    <QueryClientProvider client={queryClient}><ClerkQueryClientCacheInvalidator /><ErrorBoundary><Switch><Route path="/" component={HomeRedirect} /><Route path="/sign-in/*?" component={SignInPage} /><Route path="/sign-up/*?" component={SignUpPage} /><Route component={AuthenticatedApp} /></Switch></ErrorBoundary></QueryClientProvider>
  </ClerkProvider>;
}

function App() {
  if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
  return <WouterRouter base={basePath}><ClerkProviderWithRoutes /></WouterRouter>;
}

export default App;