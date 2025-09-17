'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/contexts/AuthContext'
import { useProfile, useUpdateProfile } from '@/src/hooks/useProfile'
import { supabase } from '@/src/lib/supabase'
import { User, Mail, Clock, Trash2, Save, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react'
import LoadingSpinner from '@/src/components/ui/loading-spinner'

interface FormData {
  firstName: string
  lastName: string
  email: string
  notificationTime: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string
  general?: string
}

interface OriginalData {
  firstName: string
  lastName: string
  email: string
  notificationTime: string
}

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id)
  const updateProfileMutation = useUpdateProfile()
  const router = useRouter()

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    notificationTime: '09:00',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [originalData, setOriginalData] = useState<OriginalData>({
    firstName: '',
    lastName: '',
    email: '',
    notificationTime: '09:00'
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile && user) {
      const initialData = {
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        email: user.email || '',
        notificationTime: profile.notification_time || '09:00'
      }
      
      setFormData(prev => ({
        ...prev,
        ...initialData
      }))
      
      setOriginalData(initialData)
    }
  }, [profile, user])

  // Redirect if not authenticated
  useEffect(() => {
    if (!user && !profileLoading) {
      router.push('/auth/signin')
    }
  }, [user, profileLoading, router])

  // Helper functions
  const hasProfileChanges = () => {
    return (
      formData.firstName !== originalData.firstName ||
      formData.lastName !== originalData.lastName ||
      formData.email !== originalData.email ||
      formData.notificationTime !== originalData.notificationTime
    )
  }

  const isChangingPassword = () => {
    return formData.newPassword.trim() !== ''
  }

  const hasAnyChanges = () => {
    return hasProfileChanges() || isChangingPassword()
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password validation only if user wants to change password (has entered new password)
    if (isChangingPassword()) {
      if (!formData.currentPassword.trim()) {
        newErrors.currentPassword = 'Current password is required to change password'
      }
      if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters'
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !user) return

    setIsSubmitting(true)
    setErrors({})
    setSuccessMessage('')

    try {
      // Update profile information
      if (profile) {
        await updateProfileMutation.mutateAsync({
          first_name: formData.firstName || null,
          last_name: formData.lastName || null,
          notification_time: formData.notificationTime || null
        })
      }

      // Update email if changed
      if (formData.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email
        })
        if (emailError) throw emailError
      }

      // Update password if provided
      if (formData.newPassword && formData.currentPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.newPassword
        })
        if (passwordError) throw passwordError
      }

      setSuccessMessage('Settings updated successfully!')
      
      // Update original data with new values (excluding password fields)
      setOriginalData({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        notificationTime: formData.notificationTime
      })
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000)
      
    } catch (error: any) {
      console.error('Error updating settings:', error)
      setErrors({ general: error.message || 'Failed to update settings' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" className="text-primary" />
          <div className="text-muted-foreground">Loading settings...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-primary hover:text-primary/80 text-sm font-medium mb-4 transition-colors"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-foreground mb-2">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your profile information, preferences, and account security.
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-green-700 dark:text-green-300">{successMessage}</span>
          </div>
        )}

        {/* General Error */}
        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-300">{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Information */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Profile Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-2">
                  First Name *
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.firstName ? 'border-red-500' : 'border-border'
                  }`}
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Account Information</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email Address *
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-border'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Preferences</h2>
            </div>
            
            <div>
              <label htmlFor="notificationTime" className="block text-sm font-medium text-foreground mb-2">
                Daily Notification Time
              </label>
              <input
                id="notificationTime"
                type="time"
                value={formData.notificationTime}
                onChange={(e) => setFormData(prev => ({ ...prev, notificationTime: e.target.value }))}
                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="mt-1 text-sm text-muted-foreground">
                When would you like to receive daily check-in reminders?
              </p>
            </div>
          </div>

          {/* Password Change */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Change Password</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Only fill these fields if you want to change your password. Leave blank to keep your current password.
            </p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.currentPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.currentPassword ? 'border-red-500' : 'border-border'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.currentPassword}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={formData.newPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className={`w-full px-3 py-2 pr-10 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                        errors.newPassword ? 'border-red-500' : 'border-border'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.newPassword}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.confirmPassword ? 'border-red-500' : 'border-border'
                    }`}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-between items-center">
            <button
              type="submit"
              disabled={isSubmitting || !hasAnyChanges()}
              className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed text-primary-foreground rounded-lg font-medium transition-colors"
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" className="text-primary-foreground" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
            {!hasAnyChanges() && !isSubmitting && (
              <p className="text-sm text-muted-foreground ml-4">
                Make changes to enable saving
              </p>
            )}
          </div>
        </form>

        {/* Danger Zone */}
        <div className="mt-12 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h2 className="text-xl font-semibold text-red-700 dark:text-red-300">Danger Zone</h2>
          </div>
          
          {!showDeleteConfirm ? (
            <div>
              <p className="text-red-600 dark:text-red-400 mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Delete Account
              </button>
            </div>
          ) : (
            <div>
              <p className="text-red-600 dark:text-red-400 mb-4">
                Are you sure you want to delete your account? Type <strong>DELETE</strong> to confirm:
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (deleteConfirmText !== 'DELETE') return
                    try {
                      setIsSubmitting(true)
                      // Note: This will require a database function to properly delete user data
                      // For now, we'll just sign out and let the user know
                      await signOut()
                      router.push('/auth/signin?message=Account deletion requested. Please contact support to complete the process.')
                    } catch (error: any) {
                      console.error('Error deleting account:', error)
                      setErrors({ general: 'Failed to delete account. Please try again.' })
                    } finally {
                      setIsSubmitting(false)
                      setShowDeleteConfirm(false)
                      setDeleteConfirmText('')
                    }
                  }}
                  disabled={deleteConfirmText !== 'DELETE' || isSubmitting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors"
                >
                  {isSubmitting ? 'Deleting...' : 'Delete Account'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteConfirmText('')
                  }}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}