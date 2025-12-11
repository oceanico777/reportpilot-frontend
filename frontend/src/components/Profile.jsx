import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { User, Mail, Lock, Save } from 'lucide-react'

export const Profile = () => {
    const { user, updatePassword } = useAuth()
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const handlePasswordUpdate = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setLoading(true)
        try {
            const { error } = await updatePassword(newPassword)
            if (error) throw error
            setSuccess('Password updated successfully!')
            setNewPassword('')
            setConfirmPassword('')
        } catch (err) {
            setError(err.message || 'Failed to update password')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="page-content">
            <header className="page-header">
                <h1>Profile Settings</h1>
            </header>

            <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '800px' }}>
                {/* User Info Card */}
                <div className="card">
                    <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={24} />
                        Account Information
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                Email
                            </label>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem',
                                background: 'var(--color-bg)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)'
                            }}>
                                <Mail size={18} color="var(--color-text-muted)" />
                                <span>{user?.email}</span>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                User ID
                            </label>
                            <div style={{
                                padding: '0.75rem',
                                background: 'var(--color-bg)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                fontFamily: 'monospace',
                                fontSize: '0.875rem'
                            }}>
                                {user?.id}
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                Role
                            </label>
                            <div style={{
                                padding: '0.75rem',
                                background: 'var(--color-bg)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)'
                            }}>
                                <span className="badge success">User</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Change Password Card */}
                <div className="card">
                    <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Lock size={24} />
                        Change Password
                    </h2>

                    <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                minLength={6}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--color-bg)',
                                    color: 'white',
                                    border: '1px solid var(--color-border)',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                minLength={6}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--color-bg)',
                                    color: 'white',
                                    border: '1px solid var(--color-border)',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        {error && (
                            <div style={{
                                padding: '0.75rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid var(--color-danger)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--color-danger)',
                                fontSize: '0.875rem'
                            }}>
                                {error}
                            </div>
                        )}

                        {success && (
                            <div style={{
                                padding: '0.75rem',
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid var(--color-success)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--color-success)',
                                fontSize: '0.875rem'
                            }}>
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn-primary"
                            style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            disabled={loading}
                        >
                            <Save size={18} />
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
