import { requireAuth } from '../../../lib/auth';
import { prisma } from '@repo/db';
import { Settings, Save, LayoutTemplate, MessageCircle, FileText } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const user = await requireAuth();
  const organizationId = user.ownedOrgs[0]?.id;

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId }
  });

  if (!organization) return null;

  async function updateSettings(formData: FormData) {
    "use server";
    const userSession = await requireAuth();
    const orgId = userSession.ownedOrgs[0]?.id;
    
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        name: formData.get('name') as string,
        gstin: formData.get('gstin') as string,
        stateCode: formData.get('stateCode') as string,
        defaultTemplate: formData.get('defaultTemplate') as string,
        whatsappNumber: formData.get('whatsappNumber') as string,
      }
    });

    redirect('/dashboard/settings');
  }

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
        <p className="text-gray-500">Configure your business details, default invoice templates, and integrations.</p>
      </div>

      <form action={updateSettings} className="space-y-8">
        {/* Business Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-800">Business Details</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Business Name</label>
              <input 
                name="name"
                defaultValue={organization.name}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">GSTIN</label>
              <input 
                name="gstin"
                defaultValue={organization.gstin || ""}
                placeholder="e.g. 27AAAAA0000A1Z5"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">State Code (2 Digits)</label>
              <input 
                name="stateCode"
                defaultValue={organization.stateCode || ""}
                placeholder="e.g. 27 for Maharashtra"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* Invoice Templates */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-800">Invoice Template</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Select the default template for all your future invoices.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['modern', 'classic', 'minimal'].map((tmpl) => (
                  <label key={tmpl} className={`relative flex cursor-pointer flex-col p-4 border rounded-xl hover:bg-gray-50 transition-colors ${organization.defaultTemplate === tmpl ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200'}`}>
                    <input 
                      type="radio" 
                      name="defaultTemplate" 
                      value={tmpl} 
                      defaultChecked={organization.defaultTemplate === tmpl}
                      className="sr-only" 
                    />
                    <span className="font-semibold text-gray-900 capitalize mb-1">{tmpl}</span>
                    <span className="text-xs text-gray-500">A clean, {tmpl} design for professional billing.</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-800">Integrations & Delivery</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-1.5 max-w-md">
              <label className="text-sm font-medium text-gray-700">Business WhatsApp Number</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                  +91
                </span>
                <input 
                  name="whatsappNumber"
                  defaultValue={organization.whatsappNumber || ""}
                  placeholder="9876543210"
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">We will use this number to send invoices via WhatsApp API.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit" 
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
