import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Compass,
  Edit3,
  FileText,
  ExternalLink,
  Filter,
  GraduationCap,
  HeartHandshake,
  House,
  Inbox,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Trash2,
  Upload,
  Download,
  UserPlus,
  UserRound,
  Users,
  Video,
  X,
  XCircle,
} from 'lucide-react';
import { Link, Route, Router as WouterRouter, Switch, useLocation, useParams } from 'wouter';
import NotFound from '@/pages/not-found';
import {
  CURRENT_USER_ID,
  type AppData,
  type Feedback,
  type Note,
  type RequestStatus,
  type Skill,
  type SkillLevel,
  formatDate,
  formatRelative,
  getMatchPercentage,
  makeId,
  setCurrentUserId,
} from '@/lib/skillswap-data';
import {
  getSession,
  loadRemoteData,
  signIn,
  signOut,
  signUp,
  subscribeToRealtime,
  syncAppData,
} from '@/lib/supabase-store';
import type { User } from '@/lib/skillswap-data';

type ToastKind = 'success' | 'error' | 'info';
type Toast = { message: string; kind: ToastKind } | null;
type Store = {
  data: AppData;
  updateData: (updater: AppData | ((current: AppData) => AppData)) => void;
  setLocalData: (updater: AppData | ((current: AppData) => AppData)) => void;
  currentUser: User;
  notify: (message: string, kind?: ToastKind) => void;
  authenticated: boolean;
  setAuthenticated: (value: boolean) => void;
};

const StoreContext = createContext<Store | null>(null);

const useStore = () => {
  const value = useContext(StoreContext);
  if (!value) throw new Error('SkillSwap store is not available');
  return value;
};

const classNames = (...values: Array<string | false | undefined>) => values.filter(Boolean).join(' ');

function Button({
  children,
  variant = 'primary',
  className,
  type = 'button',
  onClick,
  disabled,
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger' | 'outline';
  className?: string;
  type?: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
}) {
  const variants = {
    primary: 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:brightness-110',
    secondary: 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:brightness-105',
    quiet: 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))]',
    danger: 'bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:brightness-110',
    outline: 'border border-[hsl(var(--border))] bg-transparent text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]',
  };
  return (
    <button
      type={type}
      data-testid={`button-${typeof children === 'string' ? children.toLowerCase().replace(/\s+/g, '-') : 'action'}`}
      disabled={disabled}
      onClick={onClick}
      className={classNames(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition duration-200 disabled:cursor-not-allowed disabled:opacity-45',
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

function Avatar({ user, size = 'md' }: { user?: User; size?: 'sm' | 'md' | 'lg' }) {
  const initials = user?.name.split(' ').map((part) => part[0]).join('').slice(0, 2) || '?';
  const sizes = { sm: 'h-8 w-8 text-[10px]', md: 'h-10 w-10 text-xs', lg: 'h-16 w-16 text-lg' };
  return (
    <div className={classNames('flex shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--secondary))] font-display font-bold text-[hsl(var(--foreground))]', sizes[size])} data-testid={`avatar-${user?.id || 'unknown'}`}>
      {initials}
    </div>
  );
}

function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'green' | 'coral' | 'gold' }) {
  const tones = {
    default: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]',
    green: 'bg-[hsl(160 38% 86%)] text-[hsl(177 46% 25%)]',
    coral: 'bg-[hsl(6 65% 91%)] text-[hsl(6 55% 38%)]',
    gold: 'bg-[hsl(38 62% 87%)] text-[hsl(32 45% 28%)]',
  };
  return <span className={classNames('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold', tones[tone])}>{children}</span>;
}

function EmptyState({ icon: Icon = Inbox, title, body, action }: { icon?: typeof Inbox; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card)/.6)] px-6 py-14 text-center">
      <div className="mb-4 rounded-2xl bg-[hsl(var(--secondary)/.45)] p-4 text-[hsl(var(--primary))]"><Icon size={25} /></div>
      <h3 className="font-display text-xl font-bold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[hsl(var(--muted-foreground))]">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function PageLoading() {
  return <div className="min-h-[70vh] p-8"><div className="mx-auto max-w-6xl space-y-5 animate-pulse"><div className="h-10 w-1/3 rounded-xl bg-[hsl(var(--muted))]" /><div className="h-32 rounded-2xl bg-[hsl(var(--muted))]" /><div className="grid gap-5 md:grid-cols-3"><div className="h-48 rounded-2xl bg-[hsl(var(--muted))]" /><div className="h-48 rounded-2xl bg-[hsl(var(--muted))]" /><div className="h-48 rounded-2xl bg-[hsl(var(--muted))]" /></div></div></div>;
}

function ToastLayer({ toast, dismiss }: { toast: Toast; dismiss: () => void }) {
  if (!toast) return null;
  return (
    <div className={classNames('fixed bottom-5 right-5 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold shadow-2xl fade-up', toast.kind === 'error' ? 'bg-[hsl(var(--destructive))] text-white' : 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]')} role="status" data-testid="status-toast">
      {toast.kind === 'error' ? <CircleAlert size={17} /> : <CheckCircle2 size={17} />}
      <span>{toast.message}</span>
      <button onClick={dismiss} aria-label="Dismiss notification" data-testid="button-dismiss-toast"><X size={16} /></button>
    </div>
  );
}

const navGroups = [
  {
    label: 'Your space',
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { href: '/discover', label: 'Discover', icon: Compass },
      { href: '/requests', label: 'Requests', icon: Inbox },
      { href: '/messages', label: 'Messages', icon: MessageCircle },
    ],
  },
  {
    label: 'Keep moving',
    items: [
      { href: '/skills', label: 'My skills', icon: Library },
      { href: '/notes', label: 'Notes', icon: FileText },
      { href: '/sessions', label: 'Sessions', icon: CalendarDays },
      { href: '/feedback', label: 'Feedback', icon: Star },
    ],
  },
];

function Shell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentUser, data, setAuthenticated, notify } = useStore();
  const unread = data.notifications.filter((item) => !item.read).length;
  const isActive = (href: string) => location === href || (href !== '/dashboard' && location.startsWith(`${href}/`));
  const logout = async () => {
    try { await signOut(); } catch (error) { notify(error instanceof Error ? error.message : 'Could not sign out.', 'error'); return; }
    setAuthenticated(false);
    notify('You have been signed out.', 'info');
    setLocation('/login');
  };
  const navigation = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pb-8 pt-7">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)} data-testid="link-brand">
          <div className="flex h-9 w-9 rotate-[-7deg] items-center justify-center rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"><HeartHandshake size={20} /></div>
          <span className="font-display text-xl font-extrabold tracking-[-.04em]">Skill<span className="text-[hsl(var(--accent))]">Swap</span></span>
        </Link>
        <button className="text-[hsl(var(--muted-foreground))] md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation" data-testid="button-close-navigation"><X size={20} /></button>
      </div>
      <div className="flex-1 space-y-7 overflow-y-auto px-3">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">{group.label}</p>
            <nav className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link href={item.href} key={item.href} onClick={() => setMobileOpen(false)} className={classNames('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition', isActive(item.href) ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]')} data-testid={`link-nav-${item.label.toLowerCase().replace(' ', '-')}`}>
                    <Icon size={17} /><span>{item.label}</span>
                    {item.href === '/requests' && <span className={classNames('ml-auto rounded-full px-1.5 py-0.5 text-[10px]', isActive(item.href) ? 'bg-white/20' : 'bg-[hsl(var(--accent)/.18)] text-[hsl(var(--accent))]')}>{data.requests.filter((r) => r.receiverId === CURRENT_USER_ID && r.status === 'pending').length}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
        <div>
          <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">Account</p>
          <nav className="space-y-1">
            <Link href="/notifications" onClick={() => setMobileOpen(false)} className={classNames('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition', isActive('/notifications') ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]')} data-testid="link-nav-notifications">
              <Bell size={17} /><span>Notifications</span>{unread > 0 && <span className="ml-auto rounded-full bg-[hsl(var(--accent))] px-1.5 py-0.5 text-[10px] text-white">{unread}</span>}
            </Link>
            <Link href="/settings" onClick={() => setMobileOpen(false)} className={classNames('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition', isActive('/settings') ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]')} data-testid="link-nav-settings"><Settings size={17} /><span>Settings</span></Link>
          </nav>
        </div>
      </div>
      <div className="m-3 rounded-2xl bg-[hsl(var(--secondary)/.36)] p-3">
        <Link href={`/profile/${currentUser.id}`} className="flex items-center gap-3" onClick={() => setMobileOpen(false)} data-testid="link-current-profile">
          <Avatar user={currentUser} size="sm" />
          <div className="min-w-0"><p className="truncate text-sm font-bold">{currentUser.name}</p><p className="truncate text-xs text-[hsl(var(--muted-foreground))]">{currentUser.college}</p></div>
        </Link>
        <button onClick={logout} className="mt-3 flex w-full items-center gap-2 rounded-lg px-1 text-xs font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]" data-testid="button-logout"><LogOut size={14} /> Sign out</button>
      </div>
    </div>
  );
  return (
    <div className="app-grain min-h-[100dvh]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[238px] border-r border-[hsl(var(--border))] bg-[hsl(var(--background)/.9)] backdrop-blur-xl md:block">{navigation}</aside>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-[hsl(var(--foreground)/.3)] md:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={classNames('fixed inset-y-0 left-0 z-50 w-[270px] border-r border-[hsl(var(--border))] bg-[hsl(var(--background))] transition-transform md:hidden', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>{navigation}</aside>
      <main className="md:pl-[238px]">
        <header className="sticky top-0 z-30 flex h-[70px] items-center justify-between border-b border-[hsl(var(--border)/.72)] bg-[hsl(var(--background)/.78)] px-4 backdrop-blur-xl sm:px-7">
          <button className="rounded-xl p-2 hover:bg-[hsl(var(--muted))] md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation" data-testid="button-open-navigation"><Menu size={21} /></button>
          <div className="hidden text-xs font-bold text-[hsl(var(--muted-foreground))] sm:block">{location === '/dashboard' ? 'Tuesday, February 18, 2025' : 'Make your next exchange count.'}</div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/discover" className="hidden h-9 items-center gap-2 rounded-xl border border-[hsl(var(--border))] px-3 text-xs font-bold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] sm:flex" data-testid="link-header-discover"><Search size={14} /> Find a partner</Link>
            <Link href="/notifications" className="relative rounded-xl p-2.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]" aria-label="Notifications" data-testid="link-header-notifications"><Bell size={19} />{unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[hsl(var(--accent))]" />}</Link>
          </div>
        </header>
        <div className="mx-auto max-w-[1240px] p-4 pb-20 sm:p-7 lg:p-10">{children}</div>
      </main>
    </div>
  );
}

function ProtectedLayout({ children }: { children: ReactNode }) {
  const { authenticated } = useStore();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (!authenticated) setLocation('/login');
  }, [authenticated, setLocation]);
  if (!authenticated) return <PageLoading />;
  return <Shell>{children}</Shell>;
}

function PageTitle({ eyebrow, title, body, action }: { eyebrow?: string; title: string; body?: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>{eyebrow && <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--accent))]">{eyebrow}</p>}<h1 className="font-display text-3xl font-extrabold tracking-[-.045em] sm:text-4xl">{title}</h1>{body && <p className="mt-2 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">{body}</p>}</div>
    {action}
  </div>;
}

function LandingPage() {
  const [, setLocation] = useLocation();
  const people = ['Priya Sharma', 'Rahul Kumar', 'Ananya R', 'Meera K'];
  return (
    <div className="app-grain min-h-[100dvh] overflow-hidden">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" data-testid="link-landing-brand"><div className="flex h-9 w-9 rotate-[-7deg] items-center justify-center rounded-xl bg-[hsl(var(--accent))] text-white"><HeartHandshake size={20} /></div><span className="font-display text-xl font-extrabold tracking-[-.04em]">Skill<span className="text-[hsl(var(--accent))]">Swap</span></span></Link>
        <div className="flex items-center gap-2"><Link href="/login" className="rounded-xl px-3 py-2 text-sm font-bold text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]" data-testid="link-landing-login">Log in</Link><Button onClick={() => setLocation('/register')} className="min-h-9 px-3 text-xs" data-testid="button-landing-join">Join the circle <ArrowRight size={14} /></Button></div>
      </nav>
      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[1.06fr_.94fr] lg:gap-20 lg:pb-32 lg:pt-20">
          <div className="fade-up">
            <Badge tone="gold">A better kind of campus network</Badge>
            <h1 className="mt-6 max-w-3xl font-display text-5xl font-extrabold leading-[.95] tracking-[-.065em] sm:text-7xl">Trade what you know.<br /><span className="text-[hsl(var(--primary))]">Learn what is next.</span></h1>
            <p className="mt-7 max-w-lg text-lg leading-8 text-[hsl(var(--muted-foreground))]">SkillSwap turns the gaps in your timetable into tiny, useful exchanges with people who get campus life.</p>
            <div className="mt-8 flex flex-wrap items-center gap-3"><Button onClick={() => setLocation('/register')} className="px-5">Start swapping <ArrowRight size={16} /></Button><Link href="/discover" className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold text-[hsl(var(--primary))] hover:bg-[hsl(var(--muted))]" data-testid="link-landing-discover">See how it works <ChevronRight size={16} /></Link></div>
            <div className="mt-12 flex items-center gap-3"><div className="flex -space-x-2">{people.map((name) => <Avatar key={name} user={{ id: name, name, email: '', college: '', course: '', year: '', bio: '', skillsToTeach: [], skillsToLearn: [], rating: 0, availability: '' }} size="sm" />)}</div><div><p className="text-sm font-bold">Already 2,400+ exchanges</p><p className="text-xs text-[hsl(var(--muted-foreground))]">across 18 college communities</p></div></div>
          </div>
          <div className="relative min-h-[420px] fade-up fade-up-delay-1 sm:min-h-[520px]">
            <div className="absolute right-0 top-4 h-[80%] w-[79%] rounded-[2.5rem] bg-[hsl(var(--primary))] shadow-2xl shadow-[hsl(var(--primary)/.2)]" />
            <div className="absolute bottom-3 left-0 z-10 w-[78%] rotate-[-3deg] rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-xl sm:p-7">
              <div className="flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.15em] text-[hsl(var(--muted-foreground))]">A promising match</p><p className="mt-1 font-display text-2xl font-bold">Alex + Priya</p></div><div className="rounded-full bg-[hsl(160 38% 86%)] px-3 py-1.5 font-mono text-sm font-bold text-[hsl(var(--primary))]">92%</div></div>
              <div className="my-6 flex items-center gap-4"><Avatar user={{ id: 'alex', name: 'Alex Morgan', email: '', college: '', course: '', year: '', bio: '', skillsToTeach: [], skillsToLearn: [], rating: 0, availability: '' }} size="lg" /><div className="h-px flex-1 bg-[hsl(var(--border))]" /><Avatar user={{ id: 'priya', name: 'Priya Sharma', email: '', college: '', course: '', year: '', bio: '', skillsToTeach: [], skillsToLearn: [], rating: 0, availability: '' }} size="lg" /></div>
              <div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-[hsl(var(--muted))] p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">You teach</p><p className="mt-1 text-sm font-bold">Video Editing</p></div><div className="rounded-xl bg-[hsl(var(--secondary)/.45)] p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">You learn</p><p className="mt-1 text-sm font-bold">React</p></div></div>
              <Button className="mt-4 w-full">Send a hello <Send size={14} /></Button>
            </div>
            <div className="absolute right-[-5px] top-[18%] z-20 w-44 rotate-[6deg] rounded-2xl bg-[hsl(var(--secondary))] p-4 shadow-xl sm:right-[-18px]"><div className="mb-3 flex items-center justify-between"><BookOpen size={18} /><span className="font-mono text-[10px]">THIS WEEK</span></div><p className="font-display text-lg font-bold leading-tight">3 small wins waiting.</p><p className="mt-2 text-xs leading-5 text-[hsl(var(--foreground)/.7)]">One new skill can change your whole semester.</p></div>
          </div>
        </section>
        <section className="border-y border-[hsl(var(--border))] bg-[hsl(var(--card)/.6)]"><div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:grid-cols-3 sm:px-8"><div><p className="font-mono text-3xl font-bold text-[hsl(var(--primary))]">01</p><h3 className="mt-3 font-display text-xl font-bold">Name your trade</h3><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Add something you can teach and something you are curious about.</p></div><div><p className="font-mono text-3xl font-bold text-[hsl(var(--accent))]">02</p><h3 className="mt-3 font-display text-xl font-bold">Find your people</h3><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">See the overlap before you send a request. No awkward cold pitch required.</p></div><div><p className="font-mono text-3xl font-bold text-[hsl(var(--secondary-foreground))]">03</p><h3 className="mt-3 font-display text-xl font-bold">Make it real</h3><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Schedule a focused session, swap notes, and leave the other person better off.</p></div></div></section>
        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28"><div className="grid items-end gap-8 md:grid-cols-[1fr_auto]"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--accent))]">Small exchanges, real momentum</p><h2 className="mt-3 max-w-2xl font-display text-4xl font-extrabold tracking-[-.05em] sm:text-5xl">Your next useful conversation is probably already on campus.</h2></div><Link href="/register" className="inline-flex items-center gap-2 font-bold text-[hsl(var(--primary))]" data-testid="link-landing-bottom-cta">Build your circle <ArrowRight size={16} /></Link></div><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-2xl bg-[hsl(var(--primary))] p-5 text-[hsl(var(--primary-foreground))]"><Users size={22} /><p className="mt-12 font-display text-2xl font-bold">No gatekeeping.</p><p className="mt-2 text-sm opacity-75">You do not need a certificate to share something useful.</p></div><div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"><Clock3 size={22} className="text-[hsl(var(--accent))]" /><p className="mt-12 font-display text-2xl font-bold">45 minutes.</p><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Short enough to fit between class and dinner.</p></div><div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"><HeartHandshake size={22} className="text-[hsl(var(--primary))]" /><p className="mt-12 font-display text-2xl font-bold">Mutual by design.</p><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Every request starts with what both people bring.</p></div><div className="rounded-2xl bg-[hsl(var(--secondary))] p-5"><GraduationCap size={22} /><p className="mt-12 font-display text-2xl font-bold">Made for students.</p><p className="mt-2 text-sm text-[hsl(var(--foreground)/.7)]">A community that understands the semester sprint.</p></div></div></section>
      </main>
      <footer className="border-t border-[hsl(var(--border))] px-5 py-7 text-center text-xs text-[hsl(var(--muted-foreground))]">SkillSwap · Learn together, one good exchange at a time.</footer>
    </div>
  );
}

function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const [, setLocation] = useLocation();
  const { setAuthenticated, notify, refresh } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password || (mode === 'register' && !name)) { notify('Fill in the details to continue.', 'error'); return; }
    if (password.length < 6) { notify('Password must be at least 6 characters.', 'error'); return; }
    setLoading(true);
    try {
      const session = mode === 'login' ? await signIn(email.trim(), password) : await signUp(name.trim(), email.trim(), password);
      if (!session) {
        throw new Error('Could not open your SkillSwap account. Turn off Confirm email in Supabase Authentication settings and try again.');
      }
      setCurrentUserId(session.user.id);
      setAuthenticated(true);
      setLoading(false);
      notify(mode === 'login' ? 'Welcome back.' : 'Your SkillSwap profile is ready.', 'success');
      setLocation('/dashboard');
    } catch (error) {
      setLoading(false);
      notify(error instanceof Error ? error.message : 'Authentication failed. Please try again.', 'error');
    }
  };
  return (
    <div className="app-grain flex min-h-[100dvh] bg-[hsl(var(--background))]">
      <div className="hidden w-[42%] flex-col justify-between bg-[hsl(var(--primary))] p-10 text-[hsl(var(--primary-foreground))] lg:flex"><Link href="/" className="flex items-center gap-2.5" data-testid="link-auth-brand"><div className="flex h-9 w-9 rotate-[-7deg] items-center justify-center rounded-xl bg-[hsl(var(--accent))]"><HeartHandshake size={20} /></div><span className="font-display text-xl font-extrabold">Skill<span className="text-[hsl(var(--secondary))]">Swap</span></span></Link><div><p className="font-mono text-xs uppercase tracking-[.2em] opacity-60">Your campus, expanded</p><h1 className="mt-4 max-w-md font-display text-5xl font-extrabold leading-[.95] tracking-[-.06em]">The best things you learn are often peer-taught.</h1><div className="mt-8 flex items-center gap-3"><div className="h-1 w-16 rounded-full bg-[hsl(var(--secondary))]" /><span className="text-sm opacity-70">A kinder way to ask for help.</span></div></div><p className="text-xs opacity-55">SkillSwap prototype · Student community edition</p></div>
      <div className="flex flex-1 items-center justify-center p-5 sm:p-10"><div className="w-full max-w-md"><Link href="/" className="mb-12 flex items-center gap-2 lg:hidden" data-testid="link-mobile-auth-brand"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--accent))] text-white"><HeartHandshake size={19} /></div><span className="font-display text-xl font-extrabold">Skill<span className="text-[hsl(var(--accent))]">Swap</span></span></Link><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[hsl(var(--accent))]">{mode === 'login' ? 'Welcome back' : 'Start your exchange'}</p><h2 className="mt-3 font-display text-4xl font-extrabold tracking-[-.05em]">{mode === 'login' ? 'Pick up where you left off.' : 'Bring one skill. Leave with another.'}</h2><p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{mode === 'login' ? 'Your people and your next session are waiting.' : 'Create a small, useful profile in under a minute.'}</p><form onSubmit={submit} className="mt-8 space-y-4">{mode === 'register' && <label className="block"><span className="mb-1.5 block text-xs font-bold">Your name</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex Morgan" className="h-12 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 outline-none focus:border-[hsl(var(--primary))]" data-testid="input-register-name" /></label>}<label className="block"><span className="mb-1.5 block text-xs font-bold">College email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" className="h-12 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 outline-none focus:border-[hsl(var(--primary))]" data-testid="input-auth-email" /></label><label className="block"><span className="mb-1.5 block text-xs font-bold">Password</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6+ characters" className="h-12 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 outline-none focus:border-[hsl(var(--primary))]" data-testid="input-auth-password" /></label><Button type="submit" className="mt-2 w-full" disabled={loading}>{loading ? 'Opening your space…' : mode === 'login' ? 'Log in to SkillSwap' : 'Create my profile'} <ArrowRight size={16} /></Button></form><p className="mt-7 text-center text-sm text-[hsl(var(--muted-foreground))]">{mode === 'login' ? 'New to the circle?' : 'Already have a space?'} <Link href={mode === 'login' ? '/register' : '/login'} className="font-bold text-[hsl(var(--primary))]" data-testid="link-auth-switch">{mode === 'login' ? 'Create an account' : 'Log in'}</Link></p></div></div>
    </div>
  );
}

function DashboardPage() {
  const { currentUser, data } = useStore();
  const pending = data.requests.filter((request) => request.receiverId === CURRENT_USER_ID && request.status === 'pending');
  const upcoming = data.sessions.filter((session) => session.userId === CURRENT_USER_ID && session.status === 'upcoming').slice(0, 2);
  const partners = data.users
    .filter((user) => user.id !== CURRENT_USER_ID)
    .filter((user) => user.skillsToTeach.length > 0 || user.skillsToLearn.length > 0)
    .map((user) => ({ user, match: getMatchPercentage(currentUser, user) }))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, 3);
  return <div className="fade-up"><PageTitle eyebrow="Tuesday · your learning dashboard" title={`Good morning, ${currentUser.name.split(' ')[0]}.`} body="A little progress is still progress. Here is what is moving in your circle." action={<Link href="/discover" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-4 text-sm font-bold text-[hsl(var(--primary-foreground))]" data-testid="link-dashboard-discover"><Compass size={16} /> Discover people</Link>} />
    <section className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]"><div className="relative overflow-hidden rounded-3xl bg-[hsl(var(--primary))] p-6 text-[hsl(var(--primary-foreground))] sm:p-8"><div className="relative z-10 max-w-lg"><Badge tone="gold">Your exchange energy</Badge><h2 className="mt-6 font-display text-3xl font-extrabold tracking-[-.05em] sm:text-4xl">Keep the loop going.</h2><p className="mt-3 max-w-md text-sm leading-6 opacity-75">You have skills someone needs and questions someone else can answer. Two good conversations could change this week.</p><div className="mt-7 flex gap-8"><div><p className="font-mono text-3xl font-bold">{currentUser.skillsToTeach.length}</p><p className="mt-1 text-xs opacity-65">teaching</p></div><div><p className="font-mono text-3xl font-bold">{currentUser.skillsToLearn.length}</p><p className="mt-1 text-xs opacity-65">learning</p></div><div><p className="font-mono text-3xl font-bold">{data.sessions.filter((s) => s.status === 'completed').length}</p><p className="mt-1 text-xs opacity-65">completed</p></div></div></div><div className="absolute -bottom-20 -right-10 h-64 w-64 rounded-full border-[28px] border-[hsl(var(--secondary)/.35)]" /><div className="absolute right-10 top-10 h-20 w-20 rounded-full bg-[hsl(var(--accent)/.7)]" /></div><div className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-bold">Needs your attention</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Small actions, good momentum.</p></div><MoreHorizontal size={18} className="text-[hsl(var(--muted-foreground))]" /></div><div className="mt-6 space-y-4"><Link href="/requests" className="flex items-center gap-3 rounded-xl p-2 hover:bg-[hsl(var(--muted))]" data-testid="link-dashboard-requests"><div className="rounded-xl bg-[hsl(var(--accent)/.15)] p-2 text-[hsl(var(--accent))]"><Inbox size={17} /></div><div className="min-w-0 flex-1"><p className="text-sm font-bold">{pending.length} new request{pending.length === 1 ? '' : 's'}</p><p className="truncate text-xs text-[hsl(var(--muted-foreground))]">Someone wants to learn from you</p></div><ChevronRight size={15} /></Link><Link href="/skills" className="flex items-center gap-3 rounded-xl p-2 hover:bg-[hsl(var(--muted))]" data-testid="link-dashboard-skills"><div className="rounded-xl bg-[hsl(var(--secondary)/.65)] p-2"><Library size={17} /></div><div className="min-w-0 flex-1"><p className="text-sm font-bold">Tune your skill list</p><p className="truncate text-xs text-[hsl(var(--muted-foreground))]">Make your matches sharper</p></div><ChevronRight size={15} /></Link></div></div></section>
    <section className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_.8fr]"><div><div className="mb-4 flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[hsl(var(--accent))]">Good chemistry</p><h2 className="mt-1 font-display text-2xl font-bold">People worth meeting</h2></div><Link href="/discover" className="text-xs font-bold text-[hsl(var(--primary))]" data-testid="link-dashboard-all-matches">View all</Link></div><div className="space-y-3">{partners.map(({ user, match }) => <PartnerRow key={user.id} user={user} score={match.score} skill={match.learn[0] || match.teach[0] || user.skillsToTeach[0]} />)}</div></div><div><div className="mb-4 flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[hsl(var(--accent))]">On your calendar</p><h2 className="mt-1 font-display text-2xl font-bold">Next sessions</h2></div><Link href="/sessions" className="text-xs font-bold text-[hsl(var(--primary))]" data-testid="link-dashboard-sessions">Calendar</Link></div>{upcoming.length ? <div className="space-y-3">{upcoming.map((session) => <SessionMini key={session.id} session={session} />)}</div> : <EmptyState icon={CalendarDays} title="Nothing booked yet" body="Find a partner and make the first move." action={<Link href="/discover" className="text-sm font-bold text-[hsl(var(--primary))]" data-testid="link-dashboard-book-session">Find a partner</Link>} />}</div></section>
  </div>;
}

function PartnerRow({ user, score, skill }: { user: User; score: number; skill: string }) {
  return <Link href={`/profile/${user.id}`} className="lift flex items-center gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3.5" data-testid={`card-partner-${user.id}`}><Avatar user={user} /><div className="min-w-0 flex-1"><p className="font-bold">{user.name}</p><p className="mt-0.5 truncate text-xs text-[hsl(var(--muted-foreground))]">{user.course} · {user.college}</p><div className="mt-2 flex items-center gap-1.5"><Badge tone="green">{skill}</Badge><span className="text-[11px] text-[hsl(var(--muted-foreground))]">could swap with you</span></div></div><div className="text-right"><p className="font-mono text-lg font-bold text-[hsl(var(--primary))]">{score}%</p><p className="text-[10px] text-[hsl(var(--muted-foreground))]">match</p></div><ChevronRight size={16} className="text-[hsl(var(--muted-foreground))]" /></Link>;
}

function SessionMini({ session }: { session: AppData['sessions'][number] }) {
  const { data } = useStore();
  const partner = data.users.find((user) => user.id === session.partnerId);
  return <Link href="/sessions" className="flex items-center gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 hover:border-[hsl(var(--primary)/.5)]" data-testid={`card-session-${session.id}`}><div className="rounded-xl bg-[hsl(var(--secondary)/.55)] p-2.5"><CalendarDays size={18} /></div><div className="min-w-0 flex-1"><p className="text-sm font-bold">{session.skill} with {partner?.name.split(' ')[0]}</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{formatDate(session.date)} · {session.time} · {session.duration}</p></div><ChevronRight size={15} /></Link>;
}

function DiscoverPage() {
  const { currentUser, data, setLocalData, notify } = useStore();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    let cancelled = false;

    const refreshDiscover = async () => {
      try {
        const { getSupabase } = await import('./lib/supabase-client');
        const sb = getSupabase();

        const { data: memberships, error } = await sb
          .from('user_skills')
          .select('user_id, skill_id, skill_type');

        if (error) throw error;

        if (cancelled) return;

        const { data: skillRows, error: skillError } = await sb
          .from('skills')
          .select('id, name, category');

        if (skillError) throw skillError;

        const skillMap = new Map<string, { id: string; name: string; category?: string | null }>(
          (skillRows || []).map((skill: { id: string; name: string; category?: string | null }) => [skill.id, skill])
        );

        setLocalData((current) => ({
          ...current,
          skills: (memberships || []).map((item: { user_id: string; skill_id: string; skill_type: 'teach' | 'learn' }) => {
            const skill = skillMap.get(item.skill_id);
            if (!skill) return null;

            return {
              id: item.skill_id,
              name: skill.name,
              category: skill.category || 'Other',
              level: 'Intermediate',
              description: item.skill_type === 'teach'
                ? 'A skill I enjoy sharing with other students.'
                : 'A skill I would like to practice with a peer.',
              experience: 'Some experience',
              ownerId: item.user_id,
              mode: item.skill_type,
            };
          }).filter(Boolean),
        }));
      } catch (error) {
        console.error('Discover skill refresh failed:', error);
      }
    };

    refreshDiscover();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = ['All', 'Technology', 'Design', 'Communication', 'Creative', 'Business'];
  const matches = useMemo(() => {
    const everyoneElse = data.users
      .filter((user) => user.id !== CURRENT_USER_ID)
      .filter((user) => user.skillsToTeach.length > 0 || user.skillsToLearn.length > 0)
      .map((user) => ({ user, match: getMatchPercentage(currentUser, user) }));

    const filtered = everyoneElse.filter(({ user }) => {
      const text = `${user.name} ${user.course} ${user.college} ${user.skillsToTeach.join(' ')} ${user.skillsToLearn.join(' ')}`.toLowerCase();
      const categorySkill = category === 'All' || user.skillsToTeach.some((name) => data.skills.some((skill) => skill.name === name && skill.category === category));
      return text.includes(query.toLowerCase()) && categorySkill;
    });

    // With no filters, show every other registered student and sort compatible people first.
    const visible = filtered.length || query.trim() || category !== 'All' ? filtered : everyoneElse;
    return visible.sort((a, b) => b.match.score - a.match.score);
  }, [category, currentUser, data.skills, data.users, query]);
  const request = async (user: User) => {
    if (data.requests.some((item) => item.senderId === CURRENT_USER_ID && item.receiverId === user.id && item.status === 'pending')) { notify('You already have a request out to this person.', 'info'); return; }
    const request = { id: makeId('req'), senderId: CURRENT_USER_ID, receiverId: user.id, status: 'pending' as const, message: `Hi ${user.name.split(' ')[0]} — I think we could make a good exchange.`, createdAt: new Date().toISOString() };
    try {
      const { getSupabase } = await import('./lib/supabase-client');
      const { error } = await getSupabase().from('swap_requests').insert({ id: request.id, sender_id: request.senderId, receiver_id: request.receiverId, status: request.status, message: request.message, created_at: request.createdAt });
      if (error) throw error;
      setLocalData((current) => ({ ...current, requests: [...current.requests, request] }));
      notify(`Request sent to ${user.name.split(' ')[0]}.`, 'success');
    } catch (error) {
      console.error('Failed to send exchange request:', error);
      notify('Could not send the exchange request.', 'error');
    }
  };
  return <div className="fade-up"><PageTitle eyebrow="Find your people" title="Discover your next exchange." body="Search by the skill you want, the one you can share, or simply a name. The best match is not always the obvious one." /><div className="mb-7 flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><Search size={17} className="absolute left-4 top-3.5 text-[hsl(var(--muted-foreground))]" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try “React”, “writing”, or a name…" className="h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] pl-11 pr-4 text-sm outline-none focus:border-[hsl(var(--primary))]" data-testid="input-discover-search" /></label><button className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[hsl(var(--border))] px-4 text-sm font-bold hover:bg-[hsl(var(--muted))]" data-testid="button-discover-filter"><Filter size={16} /> Filters</button></div><div className="mb-8 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={classNames('whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition', category === item ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--border))]')} data-testid={`button-filter-${item.toLowerCase()}`}>{item}</button>)}</div>{matches.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{matches.map(({ user, match }) => <div key={user.id} className="lift rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5" data-testid={`card-discover-${user.id}`}><div className="flex items-start justify-between"><Link href={`/profile/${user.id}`} data-testid={`link-discover-profile-${user.id}`}><Avatar user={user} size="lg" /></Link><Badge tone="green">{match.score}% match</Badge></div><Link href={`/profile/${user.id}`} className="mt-4 block" data-testid={`link-discover-name-${user.id}`}><h3 className="font-display text-xl font-bold">{user.name}</h3><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{user.course} · {user.year}</p></Link><p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-[hsl(var(--muted-foreground))]">{user.bio}</p><div className="mt-4 flex flex-wrap gap-1.5">{user.skillsToTeach.slice(0, 3).map((skill) => <Badge key={`teach-${skill}`} tone="coral">Teaches {skill}</Badge>)}{user.skillsToLearn.slice(0, 3).map((skill) => <Badge key={`learn-${skill}`} tone="gold">Wants {skill}</Badge>)}</div><div className="mt-5 flex items-center gap-2 border-t border-[hsl(var(--border))] pt-4"><Button className="flex-1" onClick={() => request(user)}><UserPlus size={15} /> Send request</Button><Link href={`/profile/${user.id}`} className="rounded-xl p-2.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]" data-testid={`link-discover-open-${user.id}`}><ExternalLink size={16} /></Link></div></div>)}</div> : <EmptyState icon={Search} title="No close matches yet" body="Try a broader search or switch back to all categories. Your next good exchange may use different words." action={<Button variant="quiet" onClick={() => { setQuery(''); setCategory('All'); }}>Clear filters</Button>} />}</div>;
}

function ProfilePage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { currentUser, data, setLocalData, notify } = useStore();
  const user = data.users.find((item) => item.id === params.id) || currentUser;
  const match = user.id !== CURRENT_USER_ID ? getMatchPercentage(currentUser, user) : null;
  const sendRequest = async () => {
    if (user.id === CURRENT_USER_ID) return;
    if (data.requests.some((item) => item.senderId === CURRENT_USER_ID && item.receiverId === user.id && item.status === 'pending')) {
      notify('You already have a request out to this person.', 'info');
      return;
    }
    const request = { id: makeId('req'), senderId: CURRENT_USER_ID, receiverId: user.id, status: 'pending' as const, message: `Hi ${user.name.split(' ')[0]} — I think we could make a good exchange.`, createdAt: new Date().toISOString() };
    try {
      const { getSupabase } = await import('./lib/supabase-client');
      const { error } = await getSupabase().from('swap_requests').insert({ id: request.id, sender_id: request.senderId, receiver_id: request.receiverId, status: request.status, message: request.message, created_at: request.createdAt });
      if (error) throw error;
      setLocalData((current) => ({ ...current, requests: [...current.requests, request] }));
      notify(`Request sent to ${user.name.split(' ')[0]}.`, 'success');
    } catch (error) {
      console.error('Failed to send exchange request:', error);
      notify('Could not send the exchange request.', 'error');
    }
  };
  return <div className="fade-up"><button onClick={() => setLocation('/discover')} className="mb-6 flex items-center gap-2 text-sm font-bold text-[hsl(var(--muted-foreground))]" data-testid="button-profile-back"><ArrowRight className="rotate-180" size={16} /> Back to discover</button><div className="overflow-hidden rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]"><div className="h-32 bg-[hsl(var(--primary))] sm:h-44"><div className="h-full w-full opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, hsl(var(--secondary)) 0 2px, transparent 3px), radial-gradient(circle at 75% 60%, hsl(var(--accent)) 0 2px, transparent 3px)', backgroundSize: '35px 35px' }} /></div><div className="relative px-5 pb-7 sm:px-8"><div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between"><div className="flex items-end gap-4"><div className="rounded-3xl border-4 border-[hsl(var(--card))]"><Avatar user={user} size="lg" /></div><div className="pb-1"><h1 className="font-display text-2xl font-extrabold">{user.name}</h1><p className="text-sm text-[hsl(var(--muted-foreground))]">{user.course} · {user.year} · {user.college}</p></div></div>{user.id !== CURRENT_USER_ID ? <Button onClick={sendRequest}><UserPlus size={16} /> Send exchange request</Button> : <Button variant="outline" onClick={() => setLocation('/settings')}><Pencil size={15} /> Edit profile</Button>}</div><p className="mt-7 max-w-2xl text-sm leading-7 text-[hsl(var(--muted-foreground))]">{user.bio}</p><div className="mt-6 flex flex-wrap items-center gap-3 text-xs"><Badge tone="gold"><Star size={12} className="mr-1 fill-current" /> {user.rating} rating</Badge><Badge>{user.availability}</Badge>{match && <Badge tone="green">{match.score}% compatible</Badge>}</div></div></div><div className="mt-6 grid gap-5 lg:grid-cols-2"><div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6"><div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">Can teach</h2><Badge tone="coral">{user.skillsToTeach.length} skills</Badge></div><div className="mt-5 space-y-3">{user.skillsToTeach.map((skill) => <div key={skill} className="flex items-center gap-3 rounded-xl bg-[hsl(var(--muted)/.65)] p-3"><div className="rounded-lg bg-[hsl(var(--primary)/.12)] p-2 text-[hsl(var(--primary))]"><BookOpen size={16} /></div><span className="text-sm font-bold">{skill}</span></div>)}</div></div><div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6"><div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">Wants to learn</h2><Badge tone="gold">{user.skillsToLearn.length} skills</Badge></div><div className="mt-5 space-y-3">{user.skillsToLearn.map((skill) => <div key={skill} className="flex items-center gap-3 rounded-xl bg-[hsl(var(--muted)/.65)] p-3"><div className="rounded-lg bg-[hsl(var(--secondary)/.75)] p-2"><GraduationCap size={16} /></div><span className="text-sm font-bold">{skill}</span></div>)}</div></div></div></div>;
}

function SkillsPage() {
  const { currentUser, data, setLocalData, notify } = useStore();
  const [mode, setMode] = useState<'teach' | 'learn'>('teach');
  const [editing, setEditing] = useState<Skill | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [level, setLevel] = useState<SkillLevel>('Intermediate');
  const [category, setCategory] = useState('Technology');
  const skills = data.skills.filter((skill) => skill.ownerId === CURRENT_USER_ID && skill.mode === mode);
  const openAdd = () => { setEditing(null); setName(''); setFormOpen(true); };
  const openEdit = (skill: Skill) => { setEditing(skill); setName(skill.name); setLevel(skill.level); setCategory(skill.category); setFormOpen(true); };
  const saveSkill = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      notify('Give your skill a name first.', 'error');
      return;
    }

    try {
      const { getSupabase } = await import('./lib/supabase-client');
      const sb = getSupabase();

      if (editing) {
        const { error: skillError } = await sb
          .from('skills')
          .update({
            name: name.trim(),
            category,
          })
          .eq('id', editing.id);

        if (skillError) throw skillError;

        setLocalData((current) => ({
          ...current,
          skills: current.skills.map((skill) =>
            skill.id === editing.id
              ? { ...skill, name: name.trim(), level, category }
              : skill
          ),
        }));

        setFormOpen(false);
        notify('Skill updated.', 'success');
        return;
      }

      const { data: existing, error: lookupError } = await sb
        .from('skills')
        .select('id')
        .eq('name', name.trim())
        .maybeSingle();

      if (lookupError) throw lookupError;

      let skillId = existing?.id;

      if (!skillId) {
        const { data: created, error: createError } = await sb
          .from('skills')
          .insert({
            name: name.trim(),
            category,
          })
          .select('id')
          .single();

        if (createError) throw createError;
        skillId = created.id;
      }

      const newSkill = {
        id: skillId,
        name: name.trim(),
        level,
        category,
        description:
          mode === 'teach'
            ? 'A skill I enjoy sharing with other students.'
            : 'A skill I would like to practice with a peer.',
        experience: level === 'Advanced' ? 'Several years' : 'Some experience',
        ownerId: CURRENT_USER_ID,
        mode,
      };

      const { data: existingMembership, error: membershipLookupError } = await sb
        .from('user_skills')
        .select('id')
        .eq('user_id', CURRENT_USER_ID)
        .eq('skill_id', skillId)
        .eq('skill_type', mode)
        .maybeSingle();

      if (membershipLookupError) throw membershipLookupError;

      if (!existingMembership) {
        const { error: membershipInsertError } = await sb
          .from('user_skills')
          .insert({
            user_id: CURRENT_USER_ID,
            skill_id: skillId,
            skill_type: mode,
          });

        if (membershipInsertError) throw membershipInsertError;
      }

      setLocalData((current) => ({
        ...current,
        skills: [
          ...current.skills.filter(
            (skill) =>
              !(skill.ownerId === CURRENT_USER_ID && skill.name.toLowerCase() === name.trim().toLowerCase() && skill.mode === mode)
          ),
          newSkill,
        ],
      }));

      setFormOpen(false);
      notify('Skill added to your profile.', 'success');
    } catch (error) {
      console.error('Failed to save skill:', error);
      notify('Could not save this skill. Please try again.', 'error');
    }
  };

  const deleteSkill = async (id: string) => {
    try {
      const { getSupabase } = await import('./lib/supabase-client');
      const sb = getSupabase();
      const skill = data.skills.find((item) => item.id === id);

      if (!skill) return;

      const { error } = await sb
        .from('user_skills')
        .delete()
        .eq('user_id', CURRENT_USER_ID)
        .eq('skill_id', skill.id)
        .eq('skill_type', skill.mode);

      if (error) throw error;

      setLocalData((current) => ({
        ...current,
        skills: current.skills.filter((item) => item.id !== id),
      }));

      notify('Skill removed.', 'info');
    } catch (error) {
      console.error('Failed to delete skill:', error);
      notify('Could not remove this skill.', 'error');
    }
  };

  return <div className="fade-up"><PageTitle eyebrow="Your exchange profile" title="Your skills, in both directions." body="The more honest your list, the more useful your matches. Keep it specific and current." action={<Button onClick={openAdd}><Plus size={16} /> Add skill</Button>} /><div className="mb-7 flex rounded-xl bg-[hsl(var(--muted))] p-1 sm:w-fit"><button onClick={() => setMode('teach')} className={classNames('flex min-w-[130px] items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold', mode === 'teach' ? 'bg-[hsl(var(--card))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]')} data-testid="button-skills-teach"><BookOpen size={15} /> I can teach</button><button onClick={() => setMode('learn')} className={classNames('flex min-w-[130px] items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold', mode === 'learn' ? 'bg-[hsl(var(--card))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]')} data-testid="button-skills-learn"><GraduationCap size={15} /> I want to learn</button></div>{formOpen && <form onSubmit={saveSkill} className="mb-7 rounded-2xl border border-[hsl(var(--primary)/.35)] bg-[hsl(var(--card))] p-5 shadow-lg"><div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">{editing ? 'Edit skill' : `Add a skill to ${mode === 'teach' ? 'teach' : 'learn'}`}</h2><button type="button" onClick={() => setFormOpen(false)} data-testid="button-close-skill-form"><X size={18} /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-3"><label className="sm:col-span-1"><span className="mb-1.5 block text-xs font-bold">Skill name</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Motion Design" className="h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm outline-none focus:border-[hsl(var(--primary))]" data-testid="input-skill-name" /></label><label><span className="mb-1.5 block text-xs font-bold">Category</span><select value={category} onChange={(e) => setCategory(e.target.value)} className="h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm" data-testid="select-skill-category"><option>Technology</option><option>Design</option><option>Communication</option><option>Creative</option><option>Business</option></select></label><label><span className="mb-1.5 block text-xs font-bold">Level</span><select value={level} onChange={(e) => setLevel(e.target.value as SkillLevel)} className="h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm" data-testid="select-skill-level"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label></div><div className="mt-5 flex justify-end gap-2"><Button variant="quiet" onClick={() => setFormOpen(false)}>Cancel</Button><Button type="submit">{editing ? 'Save changes' : 'Add skill'}</Button></div></form>}{skills.length ? <div className="grid gap-4 md:grid-cols-2">{skills.map((skill) => <div key={skill.id} className="lift rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5" data-testid={`card-skill-${skill.id}`}><div className="flex items-start justify-between"><div className={classNames('rounded-xl p-2.5', mode === 'teach' ? 'bg-[hsl(var(--primary)/.12)] text-[hsl(var(--primary))]' : 'bg-[hsl(var(--secondary)/.65)]')}><BookOpen size={18} /></div><div className="flex gap-1"><button onClick={() => openEdit(skill)} className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]" aria-label={`Edit ${skill.name}`} data-testid={`button-edit-skill-${skill.id}`}><Edit3 size={15} /></button><button onClick={() => deleteSkill(skill.id)} className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent)/.12)] hover:text-[hsl(var(--destructive))]" aria-label={`Delete ${skill.name}`} data-testid={`button-delete-skill-${skill.id}`}><Trash2 size={15} /></button></div></div><h3 className="mt-5 font-display text-xl font-bold">{skill.name}</h3><div className="mt-2 flex gap-2"><Badge tone={mode === 'teach' ? 'green' : 'gold'}>{skill.level}</Badge><Badge>{skill.category}</Badge></div><p className="mt-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{skill.description}</p></div>)}</div> : <EmptyState icon={mode === 'teach' ? BookOpen : GraduationCap} title={`No ${mode === 'teach' ? 'teaching' : 'learning'} skills yet`} body="Add one specific skill to help the right people find you." action={<Button onClick={openAdd}><Plus size={15} /> Add your first skill</Button>} />}</div>;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function NotesPage() {
  const { data, updateData, notify } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('React');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const notes = data.notes.filter((note) => note.ownerId === CURRENT_USER_ID);

  const resetForm = () => {
    setTitle('');
    setSubject('React');
    setDescription('');
    setFile(null);
    setShowForm(false);
  };

  const uploadNote = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !file) {
      notify('Add a title and choose a note file first.', 'error');
      return;
    }
    if (file.size > 1_200_000) {
      notify('Keep demo uploads under 1.2 MB so they can be saved in this browser.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const note: Note = {
        id: makeId('note'),
        title: title.trim(),
        subject,
        description: description.trim() || 'Shared notes for the SkillSwap circle.',
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        fileData: typeof reader.result === 'string' ? reader.result : undefined,
        uploadedAt: new Date().toISOString(),
        ownerId: CURRENT_USER_ID,
      };
      updateData((current) => ({ ...current, notes: [note, ...current.notes] }));
      resetForm();
      notify('Notes uploaded to your library.', 'success');
    };
    reader.onerror = () => notify('That file could not be read. Try it again.', 'error');
    reader.readAsDataURL(file);
  };

  const removeNote = (id: string) => {
    updateData((current) => ({ ...current, notes: current.notes.filter((note) => note.id !== id) }));
    notify('Note removed from your library.', 'info');
  };

  const downloadNote = (note: Note) => {
    if (!note.fileData) {
      notify('This demo note has sample metadata but no downloadable file.', 'info');
      return;
    }
    const link = document.createElement('a');
    link.href = note.fileData;
    link.download = note.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return <div className="fade-up">
    <PageTitle eyebrow="Your study shelf" title="Notes worth swapping." body="Keep your best study guides close, then share the useful ones with your circle." action={<Button onClick={() => setShowForm(true)}><Upload size={16} /> Upload notes</Button>} />
    <div className="mb-8 grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl bg-[hsl(var(--primary))] p-5 text-[hsl(var(--primary-foreground))]"><FileText size={21} /><p className="mt-7 font-mono text-3xl font-bold">{notes.length}</p><p className="mt-1 text-sm opacity-75">notes in your library</p></div>
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"><BookOpen size={21} className="text-[hsl(var(--accent))]" /><p className="mt-7 font-mono text-3xl font-bold">{new Set(notes.map((note) => note.subject)).size}</p><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">subjects covered</p></div>
      <div className="rounded-2xl bg-[hsl(var(--secondary))] p-5"><HeartHandshake size={21} /><p className="mt-7 font-mono text-3xl font-bold">1.2 MB</p><p className="mt-1 text-sm text-[hsl(var(--foreground)/.65)]">max demo upload size</p></div>
    </div>
    {showForm && <form onSubmit={uploadNote} className="mb-8 rounded-3xl border border-[hsl(var(--primary)/.3)] bg-[hsl(var(--card))] p-5 shadow-lg sm:p-7">
      <div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[hsl(var(--accent))]">Add to your shelf</p><h2 className="mt-2 font-display text-2xl font-bold">Upload a useful note</h2></div><button type="button" onClick={resetForm} aria-label="Close upload form" data-testid="button-close-note-form"><X size={18} /></button></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label><span className="mb-1.5 block text-xs font-bold">Note title</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. SQL joins, explained simply" className="h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm outline-none focus:border-[hsl(var(--primary))]" data-testid="input-note-title" /></label>
        <label><span className="mb-1.5 block text-xs font-bold">Subject</span><select value={subject} onChange={(event) => setSubject(event.target.value)} className="h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm" data-testid="select-note-subject"><option>React</option><option>Data Analysis</option><option>Presentation</option><option>Design</option><option>Business</option><option>Other</option></select></label>
        <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold">Short description <span className="font-normal text-[hsl(var(--muted-foreground))]">(optional)</span></span><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="What will someone learn from this file?" className="w-full resize-none rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 text-sm outline-none focus:border-[hsl(var(--primary))]" data-testid="textarea-note-description" /></label>
        <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold">File</span><div className="flex flex-col gap-3 rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted)/.55)] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="rounded-xl bg-[hsl(var(--card))] p-2.5 text-[hsl(var(--primary))]"><Upload size={18} /></div><div><p className="text-sm font-bold">{file ? file.name : 'Choose a note file'}</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">PDF, Word, PowerPoint, text, or image · up to 1.2 MB</p></div></div><label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 text-xs font-bold hover:bg-[hsl(var(--background))]"><span>{file ? 'Change file' : 'Choose file'}</span><input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.png,.jpg,.jpeg" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] || null)} data-testid="input-note-file" /></label></div></label>
      </div>
      <div className="mt-6 flex justify-end gap-2"><Button variant="quiet" onClick={resetForm}>Cancel</Button><Button type="submit"><Upload size={15} /> Save notes</Button></div>
    </form>}
    {notes.length ? <div className="grid gap-4 md:grid-cols-2">{notes.map((note) => <article key={note.id} className="lift rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5" data-testid={`card-note-${note.id}`}><div className="flex items-start justify-between gap-3"><div className="rounded-xl bg-[hsl(var(--primary)/.11)] p-3 text-[hsl(var(--primary))]"><FileText size={21} /></div><Badge tone="gold">{note.subject}</Badge></div><h2 className="mt-5 font-display text-xl font-bold">{note.title}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{note.description}</p><div className="mt-5 flex items-center gap-2 border-t border-[hsl(var(--border))] pt-4 text-xs text-[hsl(var(--muted-foreground))]"><span className="min-w-0 flex-1 truncate font-bold text-[hsl(var(--foreground))]">{note.fileName}</span><span>{formatFileSize(note.fileSize)}</span></div><div className="mt-4 flex items-center gap-2"><Button variant="secondary" className="flex-1" onClick={() => downloadNote(note)}><Download size={15} /> Download</Button><button onClick={() => removeNote(note.id)} className="rounded-xl p-2.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent)/.1)] hover:text-[hsl(var(--destructive))]" aria-label={`Delete ${note.title}`} data-testid={`button-delete-note-${note.id}`}><Trash2 size={17} /></button></div><p className="mt-3 text-[11px] text-[hsl(var(--muted-foreground))]">Added {formatDate(note.uploadedAt.slice(0, 10))}</p></article>)}</div> : <EmptyState icon={FileText} title="Your note shelf is empty" body="Upload a study guide, cheat sheet, or workshop recap to keep it ready for your next exchange." action={<Button onClick={() => setShowForm(true)}><Upload size={15} /> Upload your first note</Button>} />}
  </div>;
}

function RequestsPage() {
  const { currentUser, data, setLocalData, notify } = useStore();
  const [tab, setTab] = useState<'received' | 'sent' | 'accepted' | 'completed'>('received');
  const shown = data.requests.filter((request) => tab === 'received' ? request.receiverId === CURRENT_USER_ID && request.status === 'pending' : tab === 'sent' ? request.senderId === CURRENT_USER_ID && request.status === 'pending' : request.status === tab && (request.senderId === CURRENT_USER_ID || request.receiverId === CURRENT_USER_ID));
  const person = (request: AppData['requests'][number]) => data.users.find((user) => user.id === (request.senderId === CURRENT_USER_ID ? request.receiverId : request.senderId));
  const changeStatus = async (id: string, status: RequestStatus) => {
    try {
      const { getSupabase } = await import('./lib/supabase-client');
      const { error } = await getSupabase().from('swap_requests').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      setLocalData((current) => ({ ...current, requests: current.requests.map((item) => item.id === id ? { ...item, status } : item) }));
      notify(status === 'accepted' ? 'Request accepted. Your conversation is ready.' : `Request ${status}.`, status === 'rejected' ? 'info' : 'success');
    } catch (error) {
      console.error('Failed to update exchange request:', error);
      notify('Could not update the exchange request.', 'error');
    }
  };
  return <div className="fade-up"><PageTitle eyebrow="Your exchange inbox" title="Requests, without the awkwardness." body="A clear yes, no, or not yet. Keep the good energy moving." /><div className="mb-7 flex gap-1 overflow-x-auto border-b border-[hsl(var(--border))] scrollbar-hide">{(['received', 'sent', 'accepted', 'completed'] as const).map((item) => <button key={item} onClick={() => setTab(item)} className={classNames('whitespace-nowrap border-b-2 px-4 pb-3 text-sm font-bold capitalize', tab === item ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]' : 'border-transparent text-[hsl(var(--muted-foreground))]')} data-testid={`button-requests-${item}`}>{item} {item === 'received' && <span className="ml-1 rounded-full bg-[hsl(var(--accent)/.14)] px-1.5 py-0.5 text-[10px]">{data.requests.filter((r) => r.receiverId === CURRENT_USER_ID && r.status === 'pending').length}</span>}</button>)}</div>{shown.length ? <div className="space-y-3">{shown.map((request) => { const user = person(request); if (!user) return null; return <div key={request.id} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5" data-testid={`row-request-${request.id}`}><div className="flex flex-col gap-4 sm:flex-row sm:items-start"><Avatar user={user} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Link href={`/profile/${user.id}`} className="font-display text-lg font-bold" data-testid={`link-request-user-${request.id}`}>{user.name}</Link><Badge tone={request.status === 'accepted' ? 'green' : request.status === 'completed' ? 'gold' : request.status === 'rejected' ? 'coral' : 'default'}>{request.status}</Badge></div><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{user.course} · {user.college} · {formatRelative(request.createdAt)}</p><p className="mt-4 rounded-xl bg-[hsl(var(--muted)/.7)] p-3 text-sm leading-6">{request.message}</p></div>{tab === 'received' && <div className="flex gap-2 sm:flex-col"><Button onClick={() => changeStatus(request.id, 'accepted')} className="flex-1 sm:flex-none"><Check size={15} /> Accept</Button><Button variant="outline" onClick={() => changeStatus(request.id, 'rejected')} className="flex-1 sm:flex-none"><X size={15} /> Pass</Button></div>}</div></div> })}</div> : <EmptyState icon={Inbox} title={`No ${tab} requests`} body={tab === 'received' ? 'When someone sees a good exchange, it will land here.' : 'Your exchange history will take shape as you meet people.'} action={tab !== 'received' ? <Link href="/discover" className="text-sm font-bold text-[hsl(var(--primary))]" data-testid="link-requests-discover">Discover people <ArrowRight size={14} className="inline" /></Link> : undefined} />}</div>;
}

function MessagesPage() {
  const { currentUser, data, updateData, setLocalData, notify } = useStore();
  const conversations = useMemo(() => Array.from(new Set(data.messages.map((message) => message.conversationId))).map((id) => {
    const messages = data.messages.filter((message) => message.conversationId === id);
    const otherFromMessages = messages.find((message) => message.senderId !== CURRENT_USER_ID)?.senderId;
    const acceptedRequest = data.requests.find((request) => request.status === 'accepted' && (request.senderId === CURRENT_USER_ID || request.receiverId === CURRENT_USER_ID));
    const otherId = otherFromMessages || (acceptedRequest ? (acceptedRequest.senderId === CURRENT_USER_ID ? acceptedRequest.receiverId : acceptedRequest.senderId) : undefined);
    return { id, messages, user: data.users.find((user) => user.id === otherId) };
  }).filter((item) => item.user), [data.messages, data.users, data.requests]);
  const [selected, setSelected] = useState(conversations[0]?.id || '');
  const [body, setBody] = useState('');
  const active = conversations.find((conversation) => conversation.id === selected) || conversations[0];
  useEffect(() => { if (!selected && conversations[0]) setSelected(conversations[0].id); }, [conversations, selected]);
  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!body.trim() || !active) return;
    const message = { id: makeId('msg'), conversationId: active.id, senderId: CURRENT_USER_ID, body: body.trim(), createdAt: new Date().toISOString() };
    try {
      const { getSupabase } = await import('./lib/supabase-client');
      const { error } = await getSupabase().from('messages').insert({
        id: message.id,
        conversation_id: message.conversationId,
        sender_id: message.senderId,
        content: message.body,
        created_at: message.createdAt,
      });
      if (error) throw error;
      setLocalData((current) => ({ ...current, messages: [...current.messages, message] }));
      setBody('');
      notify('Message sent.', 'success');
    } catch (error) {
      console.error('Failed to send message:', error);
      notify('Could not send the message.', 'error');
    }
  };
  return <div className="fade-up"><PageTitle eyebrow="The good part of networking" title="Messages." body="Keep the conversation human, specific, and easy to pick back up." action={<Link href="/discover" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-4 text-sm font-bold text-[hsl(var(--primary-foreground))]" data-testid="link-messages-find"><UserPlus size={15} /> New conversation</Link>} /><div className="grid min-h-[560px] overflow-hidden rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] md:grid-cols-[260px_1fr]">{conversations.length ? <><div className="border-b border-[hsl(var(--border))] md:border-b-0 md:border-r"><div className="border-b border-[hsl(var(--border))] p-4"><div className="relative"><Search size={15} className="absolute left-3 top-3 text-[hsl(var(--muted-foreground))]" /><input placeholder="Search messages" className="h-9 w-full rounded-lg bg-[hsl(var(--muted))] pl-9 pr-3 text-xs outline-none" data-testid="input-message-search" /></div></div><div className="flex overflow-x-auto p-2 md:block">{conversations.map((conversation) => <button key={conversation.id} onClick={() => setSelected(conversation.id)} className={classNames('flex min-w-[170px] items-center gap-2 rounded-xl p-3 text-left hover:bg-[hsl(var(--muted))] md:w-full', active?.id === conversation.id && 'bg-[hsl(var(--muted))]')} data-testid={`button-conversation-${conversation.id}`}><Avatar user={conversation.user} size="sm" /><div className="min-w-0"><p className="truncate text-sm font-bold">{conversation.user?.name}</p><p className="truncate text-[11px] text-[hsl(var(--muted-foreground))]">{conversation.messages.at(-1)?.body}</p></div></button>)}</div></div>{active && <div className="flex min-h-[430px] flex-col"><div className="flex items-center gap-3 border-b border-[hsl(var(--border))] p-4"><Avatar user={active.user} size="sm" /><div><p className="text-sm font-bold">{active.user?.name}</p><p className="text-xs text-[hsl(var(--muted-foreground))]">Available {active.user?.availability.toLowerCase()}</p></div><Link href={`/profile/${active.user?.id}`} className="ml-auto rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]" data-testid="link-message-profile"><ExternalLink size={16} /></Link></div><div className="flex-1 space-y-3 overflow-y-auto p-5">{active.messages.map((message) => <div key={message.id} className={classNames('flex', message.senderId === CURRENT_USER_ID ? 'justify-end' : 'justify-start')}><div className={classNames('max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6', message.senderId === CURRENT_USER_ID ? 'rounded-br-sm bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'rounded-bl-sm bg-[hsl(var(--muted))]')}><p>{message.body}</p><p className={classNames('mt-1 text-[10px]', message.senderId === CURRENT_USER_ID ? 'opacity-60' : 'text-[hsl(var(--muted-foreground))]')}>{formatRelative(message.createdAt)}</p></div></div>)}</div><form onSubmit={send} className="flex gap-2 border-t border-[hsl(var(--border))] p-4"><input value={body} onChange={(e) => setBody(e.target.value)} placeholder={`Write to ${active.user?.name.split(' ')[0]}…`} className="h-11 min-w-0 flex-1 rounded-xl bg-[hsl(var(--muted))] px-4 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/.2)]" data-testid="input-message-body" /><Button type="submit" className="h-11 w-11 px-0" aria-label="Send message"><Send size={16} /></Button></form></div>}</> : <div className="col-span-full p-5"><EmptyState icon={MessageCircle} title="No conversations yet" body="Find a partner whose skills complement yours, then start with one specific question." action={<Link href="/discover" className="text-sm font-bold text-[hsl(var(--primary))]" data-testid="link-empty-messages">Find a partner</Link>} /></div>}</div></div>;
}

function SessionsPage() {
  const { currentUser, data, setLocalData, notify } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [skill, setSkill] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('18:30');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [tab, setTab] = useState<'upcoming' | 'completed'>('upcoming');
  const partners = data.users
    .filter((user) => user.id !== CURRENT_USER_ID)
    .filter((user) => user.skillsToTeach.length > 0 || user.skillsToLearn.length > 0);
  const sessions = data.sessions.filter((session) => session.userId === CURRENT_USER_ID && session.status === tab);

  useEffect(() => {
    if (!partnerId && partners[0]) setPartnerId(partners[0].id);
    if (!skill) setSkill(currentUser.skillsToTeach[0] || currentUser.skillsToLearn[0] || '');
  }, [partners, partnerId, skill, currentUser.skillsToTeach, currentUser.skillsToLearn]);

  const schedule = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!partnerId) { notify('Choose a partner first.', 'error'); return; }
    if (!date) { notify('Choose a date for your session.', 'error'); return; }
    if (!skill.trim()) { notify('Add a skill focus.', 'error'); return; }
    if (!meetingUrl.trim()) { notify('Add the meeting link for your session.', 'error'); return; }
    const sessionId = makeId('session');
    const scheduledAt = new Date(`${date}T${time || '18:30'}:00`).toISOString();
    const session: AppData['sessions'][number] = { id: sessionId, userId: CURRENT_USER_ID, partnerId, skill: skill.trim(), date, time: time || '18:30', duration: '45 min', type: 'Video call', status: 'upcoming', meetingUrl: meetingUrl.trim() };
    try {
      const { getSupabase } = await import('./lib/supabase-client');
      const { error } = await getSupabase().from('sessions').insert({
        id: sessionId,
        host_id: CURRENT_USER_ID,
        participant_id: partnerId,
        title: session.skill,
        description: `SkillSwap session with ${data.users.find((u) => u.id === partnerId)?.name || 'your partner'}.`,
        scheduled_at: scheduledAt,
        duration_minutes: 45,
        meeting_url: session.meetingUrl,
        status: 'upcoming',
      });
      if (error) throw error;
      setLocalData((current) => ({ ...current, sessions: [...current.sessions, session] }));
      setShowForm(false);
      setMeetingUrl('');
      notify('Session scheduled.', 'success');
    } catch (error) {
      console.error('Failed to schedule session:', error);
      notify('Could not schedule the session.', 'error');
    }
  };

  const change = async (id: string, status: 'cancelled' | 'completed') => {
    try {
      const { getSupabase } = await import('./lib/supabase-client');
      const { error } = await getSupabase().from('sessions').update({ status }).eq('id', id);
      if (error) throw error;
      setLocalData((current) => ({ ...current, sessions: current.sessions.map((session) => session.id === id ? { ...session, status } : session) }));
      notify(status === 'cancelled' ? 'Session cancelled.' : 'Session marked complete.', 'info');
    } catch (error) {
      console.error('Failed to update session:', error);
      notify('Could not update the session.', 'error');
    }
  };

  const reschedule = async (id: string) => {
    const session = data.sessions.find((item) => item.id === id);
    if (!session) return;
    const next = new Date(`${session.date}T${session.time || '18:30'}:00`);
    next.setDate(next.getDate() + 1);
    const nextDate = next.toISOString().slice(0, 10);
    const nextScheduledAt = next.toISOString();
    try {
      const { getSupabase } = await import('./lib/supabase-client');
      const { error } = await getSupabase().from('sessions').update({ scheduled_at: nextScheduledAt }).eq('id', id);
      if (error) throw error;
      setLocalData((current) => ({ ...current, sessions: current.sessions.map((item) => item.id === id ? { ...item, date: nextDate } : item) }));
      notify('Session moved one day later.', 'success');
    } catch (error) {
      console.error('Failed to reschedule session:', error);
      notify('Could not reschedule the session.', 'error');
    }
  };

  return <div className="fade-up"><PageTitle eyebrow="Make the swap real" title="Sessions." body="A good exchange has a time, a little intention, and somewhere to begin." action={<Button onClick={() => setShowForm(true)}><Plus size={16} /> Schedule session</Button>} /><div className="mb-7 flex gap-1 rounded-xl bg-[hsl(var(--muted))] p-1 sm:w-fit"><button onClick={() => setTab('upcoming')} className={classNames('rounded-lg px-5 py-2.5 text-sm font-bold', tab === 'upcoming' && 'bg-[hsl(var(--card))] shadow-sm')} data-testid="button-sessions-upcoming">Upcoming <span className="ml-1 text-xs text-[hsl(var(--muted-foreground))]">{data.sessions.filter((s) => s.status === 'upcoming').length}</span></button><button onClick={() => setTab('completed')} className={classNames('rounded-lg px-5 py-2.5 text-sm font-bold', tab === 'completed' && 'bg-[hsl(var(--card))] shadow-sm')} data-testid="button-sessions-completed">Completed</button></div>{showForm && <form onSubmit={schedule} className="mb-7 grid gap-4 rounded-2xl border border-[hsl(var(--primary)/.35)] bg-[hsl(var(--card))] p-5 sm:grid-cols-2 lg:grid-cols-4"><label><span className="mb-1.5 block text-xs font-bold">Partner</span><select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className="h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm" data-testid="select-session-partner">{partners.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label><label><span className="mb-1.5 block text-xs font-bold">Skill focus</span><input value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="e.g. React or Public Speaking" className="h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm" data-testid="input-session-skill" /></label><label><span className="mb-1.5 block text-xs font-bold">Date</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm" data-testid="input-session-date" /></label><label><span className="mb-1.5 block text-xs font-bold">Time</span><input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm" data-testid="input-session-time" /></label><label className="sm:col-span-2 lg:col-span-4"><span className="mb-1.5 block text-xs font-bold">Meeting link</span><input type="url" value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="https://meet.google.com/..." className="h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm" data-testid="input-session-meeting-url" /></label><div className="flex gap-2 sm:col-span-2 lg:col-span-4 lg:justify-end"><Button variant="quiet" onClick={() => setShowForm(false)}>Cancel</Button><Button type="submit">Save session</Button></div></form>}{sessions.length ? <div className="space-y-3">{sessions.map((session) => { const user = data.users.find((item) => item.id === session.partnerId); return <div key={session.id} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5" data-testid={`card-session-detail-${session.id}`}><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><div className="flex items-center gap-3 sm:w-[38%]"><Avatar user={user} /><div><p className="font-display text-lg font-bold">{session.skill}</p><p className="text-xs text-[hsl(var(--muted-foreground))]">with {user?.name}</p></div></div><div className="grid flex-1 grid-cols-2 gap-3 text-sm sm:grid-cols-3"><div><p className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">When</p><p className="mt-1 font-bold">{formatDate(session.date)} · {session.time}</p></div><div><p className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Format</p><p className="mt-1 flex items-center gap-1.5 font-bold"><Video size={14} className="text-[hsl(var(--primary))]" />{session.type}</p></div><div><p className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Length</p><p className="mt-1 font-bold">{session.duration}</p></div></div>{tab === 'upcoming' ? <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => session.meetingUrl ? window.open(session.meetingUrl, '_blank', 'noopener,noreferrer') : notify('This session has no meeting link.', 'error')}><Video size={15} /> Join</Button><Button variant="outline" onClick={() => reschedule(session.id)} className="px-3" aria-label="Reschedule session"><CalendarDays size={15} /><span className="hidden lg:inline">Move</span></Button><button onClick={() => change(session.id, 'cancelled')} className="rounded-xl p-2.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent)/.1)] hover:text-[hsl(var(--destructive))]" aria-label="Cancel session" data-testid={`button-cancel-session-${session.id}`}><XCircle size={17} /></button></div> : <Badge tone="green"><CheckCircle2 size={13} className="mr-1" /> Finished</Badge>}</div></div> })}</div> : <EmptyState icon={CalendarDays} title={tab === 'upcoming' ? 'Your calendar is open' : 'No completed sessions yet'} body={tab === 'upcoming' ? 'Schedule a focused conversation with someone who complements your skills.' : 'After your first exchange, it will show up here.'} action={tab === 'upcoming' ? <Button onClick={() => setShowForm(true)}><Plus size={15} /> Schedule one</Button> : undefined} />}</div>;
}


function FeedbackPage() {
  const { data, updateData, notify } = useStore();
  const finished = data.sessions.filter((session) => session.status === 'completed');
  const [selectedId, setSelectedId] = useState(finished.find((session) => !data.feedback.some((item) => item.sessionId === session.id))?.id || '');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const availableTags = ['Patient', 'Practical', 'Clear', 'Encouraging', 'Prepared'];
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId) return;
    const feedback = { id: makeId('feedback'), sessionId: selectedId, rating, comment, tags, createdAt: new Date().toISOString() };
    try {
      const { getSupabase } = await import('./lib/supabase-client');
      const { error } = await getSupabase().from('feedback').insert({
        id: feedback.id,
        session_id: feedback.sessionId,
        user_id: CURRENT_USER_ID,
        rating: feedback.rating,
        comment: feedback.comment,
        tags: feedback.tags,
        created_at: feedback.createdAt,
      });
      if (error) throw error;
      updateData((current) => ({ ...current, feedback: [...current.feedback, feedback] }));
      notify('Feedback shared. Thanks for closing the loop.', 'success');
      setSelectedId(''); setComment(''); setTags([]);
    } catch (error) {
      console.error('Failed to save feedback:', error);
      notify('Could not save your feedback.', 'error');
    }
  };
  return <div className="fade-up"><PageTitle eyebrow="Close the loop" title="Leave the door open." body="A thoughtful note helps good peer teachers keep showing up." /><div className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]"><div className="space-y-3">{finished.map((session) => { const partner = data.users.find((user) => user.id === session.partnerId); const done = data.feedback.some((item) => item.sessionId === session.id); return <button key={session.id} onClick={() => !done && setSelectedId(session.id)} disabled={done} className={classNames('flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition', selectedId === session.id ? 'border-[hsl(var(--primary))] bg-[hsl(var(--card))] shadow-md' : 'border-[hsl(var(--border))] bg-[hsl(var(--card))]', done && 'opacity-60')} data-testid={`button-feedback-session-${session.id}`}><Avatar user={partner} size="sm" /><div className="min-w-0 flex-1"><p className="text-sm font-bold">{session.skill} with {partner?.name}</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{formatDate(session.date)}</p></div>{done ? <CheckCircle2 size={18} className="text-[hsl(var(--primary))]" /> : <ChevronRight size={16} />}</button> })}</div>{selectedId ? <form onSubmit={submit} className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-8"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[hsl(var(--accent))]">Your note</p><h2 className="mt-2 font-display text-2xl font-bold">How did it feel?</h2><div className="mt-7 flex gap-2">{[1, 2, 3, 4, 5].map((value) => <button type="button" key={value} onClick={() => setRating(value)} className={classNames('rounded-xl p-2 transition', value <= rating ? 'text-[hsl(var(--secondary-foreground))]' : 'text-[hsl(var(--border))]')} aria-label={`Rate ${value} out of 5`} data-testid={`button-rating-${value}`}><Star size={28} className={value <= rating ? 'fill-[hsl(var(--secondary))]' : ''} /></button>)}</div><p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">{rating === 5 ? 'That sounds like a five-star exchange.' : 'Honest feedback helps both of you grow.'}</p><label className="mt-7 block"><span className="mb-1.5 block text-xs font-bold">A quick note <span className="font-normal text-[hsl(var(--muted-foreground))]">(optional)</span></span><textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What made the session useful?" rows={4} className="w-full resize-none rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 text-sm outline-none focus:border-[hsl(var(--primary))]" data-testid="textarea-feedback" /></label><div className="mt-5"><p className="text-xs font-bold">What stood out?</p><div className="mt-2 flex flex-wrap gap-2">{availableTags.map((tag) => <button type="button" key={tag} onClick={() => setTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag])} className={classNames('rounded-full border px-3 py-1.5 text-xs font-bold', tags.includes(tag) ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.1)] text-[hsl(var(--primary))]' : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]')} data-testid={`button-feedback-tag-${tag.toLowerCase()}`}>{tag}</button>)}</div></div><Button type="submit" className="mt-7 w-full">Share feedback <ArrowRight size={15} /></Button></form> : <EmptyState icon={Star} title="You are all caught up" body="Complete another session and your next reflection will appear here." action={<Link href="/sessions" className="text-sm font-bold text-[hsl(var(--primary))]" data-testid="link-feedback-sessions">View sessions</Link>} />}</div></div>;
}

function NotificationsPage() {
  const { data, updateData, notify } = useStore();
  const markRead = async (id: string) => {
    try {
      const { getSupabase } = await import('./lib/supabase-client');
      const { error } = await getSupabase().from('notifications').update({ read: true }).eq('id', id).eq('user_id', CURRENT_USER_ID);
      if (error) throw error;
      updateData((current) => ({ ...current, notifications: current.notifications.map((item) => item.id === id ? { ...item, read: true } : item) }));
    } catch (error) { console.error('Failed to mark notification read:', error); }
  };
  const markAll = async () => {
    try {
      const { getSupabase } = await import('./lib/supabase-client');
      const { error } = await getSupabase().from('notifications').update({ read: true }).eq('user_id', CURRENT_USER_ID).eq('read', false);
      if (error) throw error;
      updateData((current) => ({ ...current, notifications: current.notifications.map((item) => ({ ...item, read: true })) }));
      notify('All notifications marked as read.', 'success');
    } catch (error) { console.error('Failed to mark notifications read:', error); notify('Could not update notifications.', 'error'); }
  };
  return <div className="fade-up"><PageTitle eyebrow="Keep in the loop" title="Notifications." body="The little nudges that keep your exchange circle moving." action={<Button variant="quiet" onClick={markAll}>Mark all read</Button>} /><div className="space-y-2">{data.notifications.length ? data.notifications.map((item) => <button key={item.id} onClick={() => markRead(item.id)} className={classNames('flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition', item.read ? 'border-[hsl(var(--border))] bg-[hsl(var(--card)/.65)]' : 'border-[hsl(var(--primary)/.25)] bg-[hsl(var(--card))] shadow-sm')} data-testid={`button-notification-${item.id}`}><div className={classNames('mt-0.5 rounded-xl p-2.5', item.type === 'request' ? 'bg-[hsl(var(--accent)/.13)] text-[hsl(var(--accent))]' : item.type === 'session' ? 'bg-[hsl(var(--secondary)/.65)]' : 'bg-[hsl(var(--primary)/.1)] text-[hsl(var(--primary))]')}>{item.type === 'request' ? <UserPlus size={17} /> : item.type === 'session' ? <CalendarDays size={17} /> : <MessageCircle size={17} />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold">{item.title}</p><span className="text-[11px] text-[hsl(var(--muted-foreground))]">{formatRelative(item.createdAt)}</span></div><p className="mt-1 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{item.body}</p></div>{!item.read && <span className="mt-2 h-2 w-2 rounded-full bg-[hsl(var(--accent))]" />}</button>) : <EmptyState icon={Bell} title="All quiet here" body="New requests, messages, and session reminders will land here." />}</div></div>;
}

function AdminPage() {
  const { data } = useStore();
  const [tab, setTab] = useState('Overview');
  const tabs = ['Overview', 'Users', 'Skills', 'Requests', 'Reports', 'Feedback'];
  const completed = data.sessions.filter((session) => session.status === 'completed').length;
  return <div className="fade-up"><PageTitle eyebrow="Admin workspace" title="Community health." body="A compact view of how the SkillSwap circle is growing and where it needs care." action={<Badge tone="green"><ShieldCheck size={13} className="mr-1" /> Prototype admin</Badge>} /><div className="mb-7 flex gap-1 overflow-x-auto rounded-xl bg-[hsl(var(--muted))] p-1 scrollbar-hide">{tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={classNames('whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-bold', tab === item && 'bg-[hsl(var(--card))] shadow-sm')} data-testid={`button-admin-${item.toLowerCase()}`}>{item}</button>)}</div>{tab === 'Overview' && <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[{ label: 'Students', value: data.users.length, icon: Users, tone: 'primary' }, { label: 'Listed skills', value: data.skills.length, icon: Library, tone: 'gold' }, { label: 'Exchange requests', value: data.requests.length, icon: HeartHandshake, tone: 'coral' }, { label: 'Sessions complete', value: completed, icon: CheckCircle2, tone: 'green' }].map(({ label, value, icon: Icon, tone }) => <div key={label} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"><div className={classNames('mb-6 flex h-9 w-9 items-center justify-center rounded-xl', tone === 'primary' ? 'bg-[hsl(var(--primary)/.12)] text-[hsl(var(--primary))]' : tone === 'gold' ? 'bg-[hsl(var(--secondary)/.7)]' : tone === 'coral' ? 'bg-[hsl(var(--accent)/.13)] text-[hsl(var(--accent))]' : 'bg-[hsl(160 38% 86%)] text-[hsl(var(--primary))]')}><Icon size={17} /></div><p className="font-mono text-3xl font-bold">{value}</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{label}</p></div>)}</div><div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]"><div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6"><div className="flex items-center justify-between"><div><h2 className="font-display text-xl font-bold">Exchange activity</h2><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Last 7 days</p></div><BarChart3 className="text-[hsl(var(--primary))]" size={20} /></div><div className="mt-8 flex h-40 items-end gap-2 sm:gap-4">{[38, 57, 43, 76, 62, 88, 72].map((height, index) => <div key={index} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-lg bg-[hsl(var(--primary))]" style={{ height: `${height}%`, opacity: .48 + index * .07 }} /><span className="font-mono text-[10px] text-[hsl(var(--muted-foreground))]">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</span></div>)}</div></div><div className="rounded-2xl bg-[hsl(var(--primary))] p-6 text-[hsl(var(--primary-foreground))]"><p className="font-mono text-[10px] uppercase tracking-[.18em] opacity-60">Community pulse</p><p className="mt-4 font-display text-3xl font-bold">4.84</p><p className="mt-1 text-sm opacity-70">average exchange rating</p><div className="my-7 h-px bg-white/20" /><p className="text-sm leading-6 opacity-80">Students are most active around Technology and Communication. Consider a campus prompt around creative skills next week.</p></div></div></>}{tab !== 'Overview' && <AdminTable tab={tab} data={data} />}</div>;
}

function AdminTable({ tab, data }: { tab: string; data: AppData }) {
  if (tab === 'Users') return <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]"><div className="border-b border-[hsl(var(--border))] p-5"><h2 className="font-display text-xl font-bold">Student directory</h2></div><div className="divide-y divide-[hsl(var(--border))]">{data.users.map((user) => <div key={user.id} className="flex items-center gap-3 p-4"><Avatar user={user} size="sm" /><div className="min-w-0 flex-1"><p className="text-sm font-bold">{user.name}</p><p className="text-xs text-[hsl(var(--muted-foreground))]">{user.email} · {user.college}</p></div><Badge tone="green">{user.rating} rating</Badge><MoreHorizontal size={17} className="text-[hsl(var(--muted-foreground))]" /></div>)}</div></div>;
  if (tab === 'Skills') return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.skills.map((skill) => <div key={skill.id} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"><div className="flex justify-between gap-3"><p className="font-bold">{skill.name}</p><Badge>{skill.mode}</Badge></div><p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">{skill.category} · {skill.level}</p><p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">Listed by {data.users.find((u) => u.id === skill.ownerId)?.name}</p></div>)}</div>;
  if (tab === 'Requests') return <div className="space-y-3">{data.requests.map((request) => <div key={request.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"><Badge tone={request.status === 'accepted' ? 'green' : 'default'}>{request.status}</Badge><p className="text-sm font-bold">{data.users.find((u) => u.id === request.senderId)?.name} <span className="font-normal text-[hsl(var(--muted-foreground))]">→</span> {data.users.find((u) => u.id === request.receiverId)?.name}</p><span className="ml-auto text-xs text-[hsl(var(--muted-foreground))]">{formatRelative(request.createdAt)}</span></div>)}</div>;
  if (tab === 'Reports') return <div className="grid gap-4 md:grid-cols-2"><div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6"><div className="flex items-center gap-3"><CircleAlert size={19} className="text-[hsl(var(--accent))]" /><h2 className="font-display text-xl font-bold">Open reports</h2></div><p className="mt-3 font-mono text-4xl font-bold">0</p><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">No community reports need review. The circle is in good shape.</p></div><div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6"><div className="flex items-center gap-3"><BarChart3 size={19} className="text-[hsl(var(--primary))]" /><h2 className="font-display text-xl font-bold">Trust signals</h2></div><div className="mt-5 space-y-3"><div><div className="flex justify-between text-xs font-bold"><span>Requests answered</span><span>78%</span></div><div className="mt-2 h-2 rounded-full bg-[hsl(var(--muted))]"><div className="h-2 w-[78%] rounded-full bg-[hsl(var(--primary))]" /></div></div><div><div className="flex justify-between text-xs font-bold"><span>Sessions completed</span><span>64%</span></div><div className="mt-2 h-2 rounded-full bg-[hsl(var(--muted))]"><div className="h-2 w-[64%] rounded-full bg-[hsl(var(--secondary-foreground))]" /></div></div></div></div></div>;
  return <div className="space-y-3">{data.feedback.length ? data.feedback.map((item) => <div key={item.id} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"><div className="flex items-center gap-2">{[1, 2, 3, 4, 5].map((star) => <Star key={star} size={15} className={star <= item.rating ? 'fill-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]' : 'text-[hsl(var(--border))]'} />)}<span className="ml-2 text-xs text-[hsl(var(--muted-foreground))]">{item.tags.join(' · ')}</span></div><p className="mt-3 text-sm">{item.comment || 'No written note.'}</p></div>) : <EmptyState icon={Star} title="No feedback yet" body="Feedback will appear after the first completed exchange." />}</div>;
}

function SettingsPage() {
  const { currentUser, updateData, notify, setAuthenticated } = useStore();
  const [, setLocation] = useLocation();
  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio);
  const [availability, setAvailability] = useState(currentUser.availability);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const { getSupabase } = await import('./lib/supabase-client');
      const { error } = await getSupabase().from('profiles').update({ full_name: name.trim(), bio, availability, updated_at: new Date().toISOString() }).eq('id', CURRENT_USER_ID);
      if (error) throw error;
      updateData((current) => ({ ...current, users: current.users.map((user) => user.id === CURRENT_USER_ID ? { ...user, name: name.trim(), bio, availability } : user) }));
      notify('Profile preferences saved.', 'success');
    } catch (error) {
      console.error('Failed to save profile:', error);
      notify('Could not save your profile.', 'error');
    }
  };
  const logout = () => { setAuthenticated(false); setLocation('/login'); };
  return <div className="fade-up"><PageTitle eyebrow="Your space, your rules" title="Settings." body="Keep your profile honest and your notifications useful." /><div className="grid gap-6 lg:grid-cols-[1fr_.7fr]"><form onSubmit={save} className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 sm:p-8"><div className="flex items-center gap-4 border-b border-[hsl(var(--border))] pb-6"><Avatar user={currentUser} size="lg" /><div><p className="font-display text-xl font-bold">{currentUser.name}</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{currentUser.email}</p></div></div><div className="mt-7 space-y-5"><label className="block"><span className="mb-1.5 block text-xs font-bold">Name</span><input value={name} onChange={(e) => setName(e.target.value)} className="h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm outline-none focus:border-[hsl(var(--primary))]" data-testid="input-settings-name" /></label><label className="block"><span className="mb-1.5 block text-xs font-bold">Short bio</span><textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="w-full resize-none rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 text-sm outline-none focus:border-[hsl(var(--primary))]" data-testid="textarea-settings-bio" /></label><label className="block"><span className="mb-1.5 block text-xs font-bold">Availability</span><input value={availability} onChange={(e) => setAvailability(e.target.value)} className="h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm outline-none focus:border-[hsl(var(--primary))]" data-testid="input-settings-availability" /></label></div><Button type="submit" className="mt-7">Save profile</Button></form><div className="space-y-4"><div className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6"><div className="flex items-center gap-3"><Bell size={18} className="text-[hsl(var(--accent))]" /><h2 className="font-display text-lg font-bold">Notifications</h2></div><p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">You will receive in-app updates for requests, messages, and upcoming sessions.</p><Link href="/notifications" className="mt-4 inline-flex text-sm font-bold text-[hsl(var(--primary))]" data-testid="link-settings-notifications">Review notifications <ArrowRight size={15} className="ml-1" /></Link></div><div className="rounded-3xl border border-[hsl(var(--accent)/.3)] bg-[hsl(var(--accent)/.07)] p-6"><h2 className="font-display text-lg font-bold">Live account</h2><p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Your profile, requests, messages, sessions, and notifications are stored in your SkillSwap account.</p></div><button onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[hsl(var(--border))] px-4 py-3 text-sm font-bold text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--destructive)/.3)] hover:text-[hsl(var(--destructive))]" data-testid="button-settings-logout"><LogOut size={16} /> Sign out of SkillSwap</button></div></div></div>;
}

const DashboardRoute = () => <ProtectedLayout><DashboardPage /></ProtectedLayout>;
const DiscoverRoute = () => <ProtectedLayout><DiscoverPage /></ProtectedLayout>;
const ProfileRoute = () => <ProtectedLayout><ProfilePage /></ProtectedLayout>;
const SkillsRoute = () => <ProtectedLayout><SkillsPage /></ProtectedLayout>;
const RequestsRoute = () => <ProtectedLayout><RequestsPage /></ProtectedLayout>;
const MessagesRoute = () => <ProtectedLayout><MessagesPage /></ProtectedLayout>;
const SessionsRoute = () => <ProtectedLayout><SessionsPage /></ProtectedLayout>;
const NotesRoute = () => <ProtectedLayout><NotesPage /></ProtectedLayout>;
const FeedbackRoute = () => <ProtectedLayout><FeedbackPage /></ProtectedLayout>;
const NotificationsRoute = () => <ProtectedLayout><NotificationsPage /></ProtectedLayout>;
const AdminRoute = () => <ProtectedLayout><AdminPage /></ProtectedLayout>;
const SettingsRoute = () => <ProtectedLayout><SettingsPage /></ProtectedLayout>;

function Router() {
  return <Switch><Route path="/" component={LandingPage} /><Route path="/login"><AuthPage mode="login" /></Route><Route path="/register"><AuthPage mode="register" /></Route><Route path="/dashboard" component={DashboardRoute} /><Route path="/discover" component={DiscoverRoute} /><Route path="/profile/:id" component={ProfileRoute} /><Route path="/skills" component={SkillsRoute} /><Route path="/notes" component={NotesRoute} /><Route path="/requests" component={RequestsRoute} /><Route path="/messages" component={MessagesRoute} /><Route path="/sessions" component={SessionsRoute} /><Route path="/feedback" component={FeedbackRoute} /><Route path="/notifications" component={NotificationsRoute} /><Route path="/admin" component={AdminRoute} /><Route path="/settings" component={SettingsRoute} /><Route component={NotFound} /></Switch>;
}

function App() {
  const [currentUserId, setCurrentUserIdState] = useState('');
  const [data, setData] = useState<AppData>({ users: [], skills: [], requests: [], messages: [], sessions: [], feedback: [], notifications: [], notes: [] });
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const refresh = async (userId: string) => {
    const remote = await loadRemoteData(userId);
    setCurrentUserId(userId);
    setCurrentUserIdState(userId);
    setData(remote);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await getSession();
        if (session && !cancelled) {
          setCurrentUserId(session.user.id);
          await refresh(session.user.id);
          if (!cancelled) setAuthenticated(true);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!authenticated || !currentUserId) return;
    return subscribeToRealtime(currentUserId, () => { refresh(currentUserId).catch(console.error); });
  }, [authenticated, currentUserId]);

  const setLocalData = (updater: AppData | ((current: AppData) => AppData)) => {
    setData((current) => typeof updater === 'function' ? updater(current) : updater);
  };

  const updateData = (updater: AppData | ((current: AppData) => AppData)) => {
    setData((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      if (currentUserId) syncAppData(next, current, currentUserId).catch((error) => console.error('Supabase sync failed', error));
      return next;
    });
  };

  const notify = (message: string, kind: ToastKind = 'success') => { setToast({ message, kind }); window.setTimeout(() => setToast(null), 3600); };

  const currentUser = (() => {
    const found = data.users.find((user) => user.id === currentUserId);
    if (!found) return {
      id: currentUserId,
      name: "Student",
      email: "",
      college: "College student",
      course: "",
      year: "",
      bio: "",
      skillsToTeach: [],
      skillsToLearn: [],
      rating: 5,
      availability: "Flexible"
    };
    return {
      ...found,
      skillsToTeach: data.skills.filter((skill) => skill.ownerId === found.id && skill.mode === "teach").map((skill) => skill.name),
      skillsToLearn: data.skills.filter((skill) => skill.ownerId === found.id && skill.mode === "learn").map((skill) => skill.name)
    };
  })();

  if (!ready) return <PageLoading />;

  return <StoreContext.Provider value={{ data, updateData, setLocalData, currentUser, notify, authenticated, setAuthenticated }}><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><ToastLayer toast={toast} dismiss={() => setToast(null)} /></StoreContext.Provider>;
}
export default App;
