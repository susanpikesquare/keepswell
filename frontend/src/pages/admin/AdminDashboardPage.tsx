import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  BookHeart,
  MessageSquare,
  DollarSign,
  Shield,
  ShieldOff,
  ArrowLeft,
  TrendingUp,
  Database,
  Server,
} from 'lucide-react';
import { useAdminAccess, useAdminStats, useAdminUsers, useSetAdminStatus } from '../../hooks/useAdmin';
import { useAuthSync } from '../../hooks';
import { Button, Card, CardHeader, CardTitle, CardContent, PageLoader } from '../../components/ui';
import { formatRelativeTime } from '../../lib/utils';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { isLoaded } = useAuthSync();
  const { data: access, isLoading: accessLoading, error: accessError } = useAdminAccess();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const setAdminStatus = useSetAdminStatus();
  const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview');

  if (!isLoaded || accessLoading) {
    return <PageLoader />;
  }

  if (accessError || !access?.isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">
          You do not have administrator access to this page.
        </p>
        <Button onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    if (window.confirm(`Are you sure you want to ${currentStatus ? 'remove' : 'grant'} admin access?`)) {
      setAdminStatus.mutate({ userId, isAdmin: !currentStatus });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground mt-1">Platform overview and management</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Stats Grid */}
          {statsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-4 bg-muted rounded w-24" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-muted rounded w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : stats ? (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                  icon={<Users className="h-5 w-5" />}
                  label="Total Users"
                  value={stats.users.total}
                  subtext={`+${stats.users.thisMonth} this month`}
                />
                <StatCard
                  icon={<BookHeart className="h-5 w-5" />}
                  label="Journals"
                  value={stats.journals.total}
                  subtext={`${stats.journals.active} active`}
                />
                <StatCard
                  icon={<MessageSquare className="h-5 w-5" />}
                  label="Entries"
                  value={stats.entries.total}
                  subtext={`${stats.entries.withMedia} with photos`}
                />
                <StatCard
                  icon={<Users className="h-5 w-5" />}
                  label="Participants"
                  value={stats.participants.total}
                  subtext={`${stats.participants.active} active`}
                />
              </div>

              {/* Cost Projections */}
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Projected Monthly Costs
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <CostCard
                  icon={<MessageSquare className="h-5 w-5" />}
                  label="SMS Messaging"
                  cost={stats.projectedCosts.smsCost}
                  detail={`${stats.projectedCosts.smsMessages} messages`}
                />
                <CostCard
                  icon={<Database className="h-5 w-5" />}
                  label="Media Storage"
                  cost={stats.projectedCosts.storageCost}
                  detail={`${stats.projectedCosts.storageMB} MB`}
                />
                <CostCard
                  icon={<Server className="h-5 w-5" />}
                  label="Hosting"
                  cost={stats.projectedCosts.hostingCost}
                  detail="Render services"
                />
                <CostCard
                  icon={<TrendingUp className="h-5 w-5" />}
                  label="Total Monthly"
                  cost={stats.projectedCosts.totalMonthly}
                  detail="All services"
                  highlight
                />
              </div>

              {/* Breakdown sections */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Users by Tier</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.users.byTier.length > 0 ? (
                      <div className="space-y-2">
                        {stats.users.byTier.map((tier) => (
                          <div key={tier.tier} className="flex justify-between items-center">
                            <span className="capitalize">{tier.tier || 'free'}</span>
                            <span className="font-semibold">{tier.count}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No tier data available</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Journals by Template</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.journals.byTemplate.length > 0 ? (
                      <div className="space-y-2">
                        {stats.journals.byTemplate.map((template) => (
                          <div key={template.template} className="flex justify-between items-center">
                            <span className="capitalize">{template.template || 'custom'}</span>
                            <span className="font-semibold">{template.count}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No template data available</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </>
      )}

      {activeTab === 'users' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">All Users</h2>
          {usersLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : users && users.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">User</th>
                    <th className="text-left px-4 py-3 font-medium">Tier</th>
                    <th className="text-left px-4 py-3 font-medium">Journals</th>
                    <th className="text-left px-4 py-3 font-medium">Entries</th>
                    <th className="text-left px-4 py-3 font-medium">Joined</th>
                    <th className="text-left px-4 py-3 font-medium">Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{user.full_name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize text-sm px-2 py-1 rounded-full bg-muted">
                          {user.subscription_tier || 'free'}
                        </span>
                      </td>
                      <td className="px-4 py-3">{user.journalCount}</td>
                      <td className="px-4 py-3">{user.entryCount}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatRelativeTime(user.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant={user.is_admin ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                          disabled={setAdminStatus.isPending}
                        >
                          {user.is_admin ? (
                            <>
                              <Shield className="h-4 w-4 mr-1" />
                              Admin
                            </>
                          ) : (
                            <>
                              <ShieldOff className="h-4 w-4 mr-1" />
                              User
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground">No users found</p>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtext,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  subtext: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value.toLocaleString()}</div>
        <div className="text-sm text-muted-foreground">{subtext}</div>
      </CardContent>
    </Card>
  );
}

function CostCard({
  icon,
  label,
  cost,
  detail,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  cost: number;
  detail: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? 'border-primary bg-primary/5' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${highlight ? 'text-primary' : ''}`}>
          ${cost.toFixed(2)}
        </div>
        <div className="text-sm text-muted-foreground">{detail}</div>
      </CardContent>
    </Card>
  );
}
