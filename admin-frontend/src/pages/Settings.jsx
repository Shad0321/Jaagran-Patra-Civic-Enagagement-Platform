import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Bell, Shield, Database, Mail, Users, Save, RefreshCw } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        general: {
            siteName: 'JagranPatra Admin',
            siteDescription: 'Citizen Issue Management System',
            contactEmail: 'admin@jagranpatra.com',
            supportPhone: '+91-1234567890',
            timezone: 'Asia/Kolkata',
            language: 'en',
            maintenanceMode: false
        },
        notifications: {
            emailNotifications: true,
            smsNotifications: false,
            pushNotifications: true,
            issueCreated: true,
            issueResolved: true,
            newUserRegistration: true,
            systemAlerts: true,
            dailyDigest: true,
            weeklyReports: true
        },
        security: {
            sessionTimeout: 30,
            passwordExpiry: 90,
            maxLoginAttempts: 5,
            twoFactorAuth: false,
            ipWhitelist: '',
            securityLogging: true,
            dataRetentionDays: 365
        },
        email: {
            smtpHost: 'smtp.gmail.com',
            smtpPort: 587,
            smtpUsername: '',
            smtpPassword: '',
            smtpSecurity: 'TLS',
            fromEmail: 'noreply@jagranpatra.com',
            fromName: 'JagranPatra System'
        },
        database: {
            backupEnabled: true,
            backupFrequency: 'daily',
            backupRetention: 30,
            maintenanceWindow: '02:00',
            indexOptimization: true
        },
        integrations: {
            googleMapsApiKey: '',
            smsGatewayUrl: '',
            smsGatewayApiKey: '',
            analyticsTrackingId: '',
            crashReportingEnabled: true
        }
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/admin/settings');
            if (response.data) {
                setSettings(prevSettings => ({
                    ...prevSettings,
                    ...response.data
                }));
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            // Keep default settings if fetch fails
            toast.error('Failed to load settings. Using default values.');
        }
    };

    const updateSettings = async (category, newSettings) => {
        try {
            setLoading(true);
            await api.put('/admin/settings', { category, settings: newSettings });
            setSettings(prev => ({ ...prev, [category]: newSettings }));
            toast.success('Settings updated successfully');
        } catch (error) {
            toast.error('Failed to update settings');
            console.error('Error updating settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const testEmailConfiguration = async () => {
        try {
            await api.post('/admin/settings/test-email');
            toast.success('Test email sent successfully');
        } catch (error) {
            console.error('Error sending test email:', error);
            toast.error('Failed to send test email');
        }
    };

    const clearCache = async () => {
        try {
            await api.post('/admin/settings/clear-cache');
            toast.success('Cache cleared successfully');
        } catch (error) {
            console.error('Error clearing cache:', error);
            toast.error('Failed to clear cache');
        }
    };

    const tabs = [
        { id: 'general', label: 'General', icon: SettingsIcon },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'email', label: 'Email', icon: Mail },
        { id: 'database', label: 'Database', icon: Database },
        { id: 'integrations', label: 'Integrations', icon: Users }
    ];

    const GeneralSettings = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                    <input
                        type="text"
                        value={settings.general?.siteName || ''}
                        onChange={(e) => setSettings(prev => ({
                            ...prev,
                            general: { ...prev.general, siteName: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                    <input
                        type="email"
                        value={settings.general?.contactEmail || ''}
                        onChange={(e) => setSettings(prev => ({
                            ...prev,
                            general: { ...prev.general, contactEmail: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Support Phone</label>
                    <input
                        type="tel"
                        value={settings.general?.supportPhone || ''}
                        onChange={(e) => setSettings(prev => ({
                            ...prev,
                            general: { ...prev.general, supportPhone: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                    <select
                        value={settings.general?.timezone || 'Asia/Kolkata'}
                        onChange={(e) => setSettings(prev => ({
                            ...prev,
                            general: { ...prev.general, timezone: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="Asia/Kolkata">Asia/Kolkata</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="Europe/London">Europe/London</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Description</label>
                <textarea
                    value={settings.general?.siteDescription || ''}
                    onChange={(e) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, siteDescription: e.target.value }
                    }))}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div className="flex items-center">
                <input
                    type="checkbox"
                    checked={settings.general?.maintenanceMode || false}
                    onChange={(e) => setSettings(prev => ({
                        ...prev,
                        general: { ...prev.general, maintenanceMode: e.target.checked }
                    }))}
                    className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">Maintenance Mode</label>
                <span className="ml-2 text-sm text-gray-500">(Puts site in maintenance mode)</span>
            </div>
            <button
                onClick={() => updateSettings('general', settings.general)}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save General Settings'}
            </button>
        </div>
    );

    const NotificationSettings = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Notification Types</h3>
                    {Object.entries(settings.notifications || {}).map(([key, value]) => (
                        <div key={key} className="flex items-center">
                            <input
                                type="checkbox"
                                checked={value}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    notifications: { ...prev.notifications, [key]: e.target.checked }
                                }))}
                                className="mr-2"
                            />
                            <label className="text-sm font-medium text-gray-700 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                            </label>
                        </div>
                    ))}
                </div>
            </div>
            <button
                onClick={() => updateSettings('notifications', settings.notifications)}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Notification Settings'}
            </button>
        </div>
    );

    const SecuritySettings = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                    <input
                        type="number"
                        value={settings.security?.sessionTimeout || 30}
                        onChange={(e) => setSettings(prev => ({
                            ...prev,
                            security: { ...prev.security, sessionTimeout: parseInt(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password Expiry (days)</label>
                    <input
                        type="number"
                        value={settings.security?.passwordExpiry || 90}
                        onChange={(e) => setSettings(prev => ({
                            ...prev,
                            security: { ...prev.security, passwordExpiry: parseInt(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
                    <input
                        type="number"
                        value={settings.security?.maxLoginAttempts || 5}
                        onChange={(e) => setSettings(prev => ({
                            ...prev,
                            security: { ...prev.security, maxLoginAttempts: parseInt(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data Retention (days)</label>
                    <input
                        type="number"
                        value={settings.security?.dataRetentionDays || 365}
                        onChange={(e) => setSettings(prev => ({
                            ...prev,
                            security: { ...prev.security, dataRetentionDays: parseInt(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">IP Whitelist</label>
                <textarea
                    value={settings.security?.ipWhitelist || ''}
                    onChange={(e) => setSettings(prev => ({
                        ...prev,
                        security: { ...prev.security, ipWhitelist: e.target.value }
                    }))}
                    rows="3"
                    placeholder="Enter IP addresses separated by commas"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div className="space-y-4">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        checked={settings.security?.twoFactorAuth || false}
                        onChange={(e) => setSettings(prev => ({
                            ...prev,
                            security: { ...prev.security, twoFactorAuth: e.target.checked }
                        }))}
                        className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">Two-Factor Authentication</label>
                </div>
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        checked={settings.security?.securityLogging || false}
                        onChange={(e) => setSettings(prev => ({
                            ...prev,
                            security: { ...prev.security, securityLogging: e.target.checked }
                        }))}
                        className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">Security Logging</label>
                </div>
            </div>
            <button
                onClick={() => updateSettings('security', settings.security)}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Security Settings'}
            </button>
        </div>
    );

    const EmailSettings = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
                    <input
                        type="text"
                        value={settings.email?.smtpHost || ''}
                        onChange={(e) => setSettings(prev => ({
                            ...prev,
                            email: { ...prev.email, smtpHost: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                    <input
                        type="number"
                        value={settings.email?.smtpPort || 587}
                        onChange={(e) => setSettings(prev => ({
                            ...prev,
                            email: { ...prev.email, smtpPort: parseInt(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Username</label>
                    <input
                        type="text"
                        value={settings.email?.smtpUsername || ''}
                        onChange={(e) => setSettings(prev => ({
                            ...prev,
                            email: { ...prev.email, smtpUsername: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Password</label>
                    <input
                        type="password"
                        value={settings.email?.smtpPassword || ''}
                        onChange={(e) => setSettings(prev => ({
                            ...prev,
                            email: { ...prev.email, smtpPassword: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Email</label>
                    <input
                        type="email"
                        value={settings.email?.fromEmail || ''}
                        onChange={(e) => setSettings(prev => ({
                            ...prev,
                            email: { ...prev.email, fromEmail: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Name</label>
                    <input
                        type="text"
                        value={settings.email?.fromName || ''}
                        onChange={(e) => setSettings(prev => ({
                            ...prev,
                            email: { ...prev.email, fromName: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
            <div className="flex space-x-4">
                <button
                    onClick={() => updateSettings('email', settings.email)}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Email Settings'}
                </button>
                <button
                    onClick={testEmailConfiguration}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                    <Mail className="h-4 w-4 mr-2" />
                    Test Email
                </button>
            </div>
        </div>
    );

    const DatabaseSettings = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
                    <select
                        value={settings.database?.backupFrequency || 'daily'}
                        onChange={(e) => setSettings(prev => ({
                            ...prev,
                            database: { ...prev.database, backupFrequency: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Backup Retention (days)</label>
                    <input
                        type="number"
                        value={settings.database?.backupRetention || 30}
                        onChange={(e) => setSettings(prev => ({
                            ...prev,
                            database: { ...prev.database, backupRetention: parseInt(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance Window</label>
                    <input
                        type="time"
                        value={settings.database?.maintenanceWindow || '02:00'}
                        onChange={(e) => setSettings(prev => ({
                            ...prev,
                            database: { ...prev.database, maintenanceWindow: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
            <div className="space-y-4">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        checked={settings.database?.backupEnabled || false}
                        onChange={(e) => setSettings(prev => ({
                            ...prev,
                            database: { ...prev.database, backupEnabled: e.target.checked }
                        }))}
                        className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">Automatic Backups</label>
                </div>
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        checked={settings.database?.indexOptimization || false}
                        onChange={(e) => setSettings(prev => ({
                            ...prev,
                            database: { ...prev.database, indexOptimization: e.target.checked }
                        }))}
                        className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">Index Optimization</label>
                </div>
            </div>
            <div className="flex space-x-4">
                <button
                    onClick={() => updateSettings('database', settings.database)}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Database Settings'}
                </button>
                <button
                    onClick={clearCache}
                    className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear Cache
                </button>
            </div>
        </div>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return <GeneralSettings />;
            case 'notifications':
                return <NotificationSettings />;
            case 'security':
                return <SecuritySettings />;
            case 'email':
                return <EmailSettings />;
            case 'database':
                return <DatabaseSettings />;
            default:
                return <GeneralSettings />;
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
                <p className="text-gray-600">Configure system settings and preferences</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar */}
                <div className="lg:w-64 flex-shrink-0">
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <nav className="space-y-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab.id
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    <tab.icon className="h-4 w-4 mr-3" />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        {renderTabContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
