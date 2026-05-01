'use client';

import { useActionState } from 'react';
import { loginOrRegister } from './actions';
import dashboardStyles from '../page.module.css';

export default function LoginPage() {
  const [state, action, isPending] = useActionState(loginOrRegister, null);

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-secondary)' }}>
      <div style={{ backgroundColor: 'var(--bg-primary)', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', textAlign: 'center' }}>InvoiceHQ Login</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          Enter any email and password to sign in or register instantly.
        </p>
        
        <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {state?.error && (
            <div style={{ color: 'var(--danger)', backgroundColor: '#fee2e2', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
              {state.error}
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Email</label>
            <input name="email" type="email" required style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-primary)' }} />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Password</label>
            <input name="password" type="password" required style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-primary)' }} />
          </div>
          
          <button disabled={isPending} type="submit" className={dashboardStyles.button} style={{ marginTop: '1rem' }}>
            {isPending ? 'Logging in...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
