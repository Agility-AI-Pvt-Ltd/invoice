'use client';

import { useActionState } from 'react';
import { completeOnboarding } from './actions';
import dashboardStyles from '../page.module.css';

export default function OnboardingPage() {
  const [state, action, isPending] = useActionState(completeOnboarding, null);

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-secondary)' }}>
      <div style={{ backgroundColor: 'var(--bg-primary)', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', width: '100%', maxWidth: '500px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Welcome to InvoiceHQ!</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          Let's set up your business details so you can start creating GST invoices.
        </p>
        
        <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {state?.error && (
            <div style={{ color: 'var(--danger)', backgroundColor: '#fee2e2', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
              {state.error}
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Company Name</label>
            <input name="orgName" required placeholder="Acme Corp" style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-primary)' }} />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>GSTIN (Optional)</label>
              <input name="gstin" placeholder="27AAAAA0000A1Z5" style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-primary)' }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '120px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>State Code</label>
              <input name="stateCode" required placeholder="27" maxLength={2} style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-primary)' }} />
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Address</label>
            <textarea name="address" rows={2} style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-primary)', resize: 'none' }}></textarea>
          </div>
          
          <button disabled={isPending} type="submit" className={dashboardStyles.button} style={{ marginTop: '1rem' }}>
            {isPending ? 'Saving...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}
