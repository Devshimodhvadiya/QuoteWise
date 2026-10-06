import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/index';
import { Badge } from '../../components/ui/index';
import { formatDate } from '../../utils';
import { DEFAULT_WEIGHTS } from '../../types';
import { Button } from '../../components/ui/Button';
import { seedDemoData } from '../../utils/seedData';
import toast from 'react-hot-toast';

const SettingsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    if (!userProfile) return;
    setSeeding(true);
    try {
      await seedDemoData(userProfile.companyName, userProfile.uid, userProfile.name);
      toast.success('Demo data seeded successfully! Refresh to see it.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to seed demo data');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Application and account settings"
      />

      <div className="p-6 max-w-2xl space-y-6">
        {/* Account info */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Account Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">Full Name</span>
              <span className="font-medium text-slate-900">{userProfile?.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">Email</span>
              <span className="font-medium text-slate-900">{userProfile?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">Company</span>
              <span className="font-medium text-slate-900">{userProfile?.companyName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">Role</span>
              <Badge className={
                userProfile?.role === 'admin'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }>
                {userProfile?.role === 'admin' ? '🔐 Admin' : '👤 Employee'}
              </Badge>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Member Since</span>
              <span className="font-medium text-slate-900">{formatDate(userProfile?.createdAt ?? null)}</span>
            </div>
          </div>
        </Card>

        {/* Default comparison weights */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Default Comparison Weights</h3>
          <p className="text-xs text-slate-400 mb-4">
            These are the system default weights. You can adjust them per comparison on the comparison page.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(DEFAULT_WEIGHTS).map(([key, val]) => (
              <div key={key} className="bg-slate-50 rounded-lg px-4 py-3">
                <p className="text-xs text-slate-500 capitalize">{key}</p>
                <p className="text-xl font-bold text-indigo-700 mt-0.5">{val}%</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Weights are configurable per comparison. Total must always equal 100%.
          </p>
        </Card>

        {/* Firebase info */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Data & Storage</h3>
          <div className="space-y-2 text-sm text-slate-600">
            <p>✅ <strong>Firebase Authentication</strong> — Email/Password</p>
            <p>✅ <strong>Cloud Firestore</strong> — All data is stored in Firestore</p>
            <p>✅ <strong>Role-Based Access</strong> — Firestore Security Rules enforced</p>
            <p>✅ <strong>Company Isolation</strong> — Data is isolated per company</p>
          </div>
        </Card>

        {/* Sample data */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Sample Workspace Data</h3>
          <p className="text-xs text-slate-400 mb-4">
            Populate sample vendors, requirements, and quotations specifically for {userProfile?.companyName}.
          </p>
          <Button variant="outline" size="sm" loading={seeding} onClick={handleSeed}>
            🌱 Seed Sample Data
          </Button>
        </Card>

        {/* App version */}
        <Card padding="sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>QuoteWise v1.0.0</span>
            <span>Firebase + React + TypeScript</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
