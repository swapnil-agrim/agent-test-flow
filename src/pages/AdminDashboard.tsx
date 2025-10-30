import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Settings, Users, Link2, LogOut, Database, Code } from 'lucide-react';

const AdminDashboard = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  
  // Connectors state
  const [connectors, setConnectors] = useState([
    { id: '1', name: 'GitHub', type: 'repository', status: 'connected', apiKey: 'ghp_****' },
    { id: '2', name: 'Jira', type: 'issue-tracker', status: 'disconnected', apiKey: '' },
    { id: '3', name: 'TestRail', type: 'test-management', status: 'disconnected', apiKey: '' },
  ]);

  // Users state
  const [users, setUsers] = useState([
    { id: '1', username: 'admin', email: 'admin@example.com', role: 'admin', status: 'active' },
    { id: '2', username: 'user', email: 'user@example.com', role: 'user', status: 'active' },
  ]);

  const [newUser, setNewUser] = useState({ username: '', email: '', role: 'user' });

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const handleInviteUser = () => {
    if (!newUser.username || !newUser.email) {
      toast.error('Please fill in all fields');
      return;
    }

    const user = {
      id: crypto.randomUUID(),
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      status: 'invited'
    };

    setUsers([...users, user]);
    setNewUser({ username: '', email: '', role: 'user' });
    toast.success(`Invitation sent to ${newUser.email}`);
  };

  const handleConnectorToggle = (id: string) => {
    setConnectors(connectors.map(c => 
      c.id === id 
        ? { ...c, status: c.status === 'connected' ? 'disconnected' : 'connected' }
        : c
    ));
    toast.success('Connector status updated');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Logged in as <strong>{user?.username}</strong>
            </span>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="connectors" className="space-y-6">
          <TabsList>
            <TabsTrigger value="connectors" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Connectors
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              System Settings
            </TabsTrigger>
          </TabsList>

          {/* Connectors Tab */}
          <TabsContent value="connectors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Integration Connectors</CardTitle>
                <CardDescription>
                  Manage connections to external systems for test case discovery
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>API Key</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {connectors.map((connector) => (
                      <TableRow key={connector.id}>
                        <TableCell className="font-medium">{connector.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{connector.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={connector.status === 'connected' ? 'default' : 'secondary'}>
                            {connector.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs">{connector.apiKey || 'Not configured'}</code>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConnectorToggle(connector.id)}
                          >
                            {connector.status === 'connected' ? 'Disconnect' : 'Connect'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invite New User</CardTitle>
                <CardDescription>Send invitation to add new team members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="Enter username"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <select
                      id="role"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <Button onClick={handleInviteUser} className="mt-4">
                  Send Invitation
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User List</CardTitle>
                <CardDescription>Manage existing users and their roles</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === 'active' ? 'default' : 'outline'}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>Configure system-wide settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input id="org-name" placeholder="Your Organization" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test-timeout">Default Test Timeout (seconds)</Label>
                  <Input id="test-timeout" type="number" defaultValue="30" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retention">Data Retention (days)</Label>
                  <Input id="retention" type="number" defaultValue="90" />
                </div>
                <Button>Save Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
