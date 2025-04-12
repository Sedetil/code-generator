"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { 
  Loader2, 
  Camera, 
  User, 
  Lock, 
  Shield, 
  LogOut, 
  AlertCircle,
  Trash2 
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getUserProfile, createUserProfile, uploadAvatar } from "@/lib/supabase-utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [userData, setUserData] = useState({
    displayName: "",
    email: "",
    photoURL: "",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isGoogleUser, setIsGoogleUser] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.user) {
          router.push("/")
          return
        }

        setUser(session.user)

        // Check if user is signed in with Google
        const isGoogle = session.user.app_metadata.provider === "google"
        setIsGoogleUser(isGoogle)

        // Get user profile from Supabase
        const profile = await getUserProfile(session.user.id)

        if (profile) {
          setUserData({
            displayName: profile.display_name || "",
            email: session.user.email || "",
            photoURL: profile.avatar_url || "",
          })
        } else {
          setUserData({
            displayName: session.user.user_metadata.display_name || "",
            email: session.user.email || "",
            photoURL: session.user.user_metadata.avatar_url || "",
          })
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching user data:", error)
        setLoading(false)
        router.push("/")
      }
    }

    fetchUserData()
  }, [router])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setPhotoFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoPreview(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setUpdating(true)
    try {
      // Update profile photo if changed
      let photoURL = userData.photoURL
      if (photoFile) {
        photoURL = await uploadAvatar(user.id, photoFile)
      }

      // Update user profile in Supabase
      await createUserProfile(user.id, {
        displayName: userData.displayName,
        photoURL: photoURL,
      })

      // Update user metadata in Supabase Auth
      const { error } = await supabase.auth.updateUser({
        data: { display_name: userData.displayName },
      })

      if (error) throw error

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      })

      // Update local state
      setUserData({
        ...userData,
        photoURL: photoURL,
      })
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || isGoogleUser) return

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "New password and confirmation do not match",
        variant: "destructive",
      })
      return
    }

    setUpdating(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (error) throw error

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully",
      })

      // Reset password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error: any) {
      console.error("Error changing password:", error)
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to change password",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      router.push("/")
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully",
      })
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        title: "Sign Out Failed",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmText !== userData.email) return

    setDeleting(true)
    try {
      // First delete user's data from snippets table
      const { error: snippetsError } = await supabase
        .from("snippets")
        .delete()
        .eq("user_id", user.id)

      if (snippetsError) throw snippetsError

      // Delete avatar from storage if one exists
      if (userData.photoURL && userData.photoURL.includes("avatars/")) {
        try {
          const urlParts = userData.photoURL.split("avatars/")
          if (urlParts.length > 1) {
            const avatarPath = urlParts[1]
            const { error: storageError } = await supabase
              .storage
              .from("avatars")
              .remove([avatarPath])

            if (storageError) console.error("Error deleting avatar:", storageError)
          }
        } catch (err) {
          console.error("Error parsing avatar URL:", err)
        }
      }

      // Delete user profile from profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id)

      if (profileError) throw profileError

      // Delete the user account
      const { error: userError } = await supabase.rpc('delete_user')
      
      if (userError) throw userError

      // Ensure we sign out after account deletion
      await supabase.auth.signOut()
      
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted",
      })
      
      // Clear any local storage or cookies that might keep session info
      localStorage.removeItem('supabase.auth.token')
      
      // Use replace instead of push to prevent going back to profile page
      router.replace("/")
    } catch (error: any) {
      console.error("Error deleting account:", error)
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete account. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400pxx]">
        <Loader2 className="h-8 w-8 animate-spi text-primaryn text-primary" />
      </div>
    )
  }

  if (!user) {
    // This should not be visible as we redirect in useEffect
    return null
  }

  // Determine which tabs to show based on authentication provider
  const getTabs = () => {
    const tabs = [
      { id: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
      { id: "security", label: "Security", icon: <Shield className="h-4 w-4" /> },
    ]

    // Only show password tab for email/password users
    if (!isGoogleUser) {
      tabs.splice(1, 0, { id: "password", label: "Password", icon: <Lock className="h-4 w-4" /> })
    }

    return tabs
  }

  const tabs = getTabs()

  return (
    <div className="responsive-container py-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList
          className="grid w-full mb-6"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        >
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
              {tab.icon}
              <span>{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="responsive-flex-col-row items-center sm:items-start responsive-gap">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={photoPreview || userData.photoURL} alt={userData.displayName} />
                      <AvatarFallback className="text-2xl">
                        {userData.displayName ? userData.displayName[0].toUpperCase() : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <label
                      htmlFor="photo-upload"
                      className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1 rounded-full cursor-pointer"
                    >
                      <Camera className="h-4 w-4" />
                      <span className="sr-only">Upload photo</span>
                    </label>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </div>

                  <div className="space-y-4 flex-1">
                    <div className="grid gap-2">
                      <Label htmlFor="displayName">Full Name</Label>
                      <Input
                        id="displayName"
                        value={userData.displayName}
                        onChange={(e) => setUserData({ ...userData, displayName: e.target.value })}
                        placeholder="Your full name"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userData.email}
                        disabled={true}
                        placeholder="your.email@example.com"
                      />
                      <p className="text-xs text-muted-foreground flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Email cannot be changed after registration
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={updating}>
                    {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {!isGoogleUser && (
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password to keep your account secure</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Enter your new password"
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Confirm your new password"
                      required
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={updating}>
                      {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Change Password
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>Manage your account security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Account Sessions</h3>
                <p className="text-sm text-muted-foreground">
                  You are currently logged in on this device. For security reasons, you should sign out when using
                  shared devices.
                </p>
                <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Account Protection</h3>
                <p className="text-sm text-muted-foreground">
                  We recommend using a strong, unique password and regularly updating it to keep your account secure.
                </p>
                <div className="bg-muted p-4 rounded-md text-sm">
                  <p className="font-medium">Security Tips:</p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Use a password that is at least 8 characters long</li>
                    <li>Include a mix of letters, numbers, and special characters</li>
                    <li>Don't reuse passwords from other sites</li>
                    <li>Never share your password with anyone</li>
                  </ul>
                </div>
              </div>

              {isGoogleUser && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-100 dark:border-blue-800">
                  <h3 className="text-lg font-medium flex items-center text-blue-700 dark:text-blue-300">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Google Account
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-300 mt-2">
                    You're signed in with Google. Some account settings like password can only be changed through your
                    Google account.
                  </p>
                </div>
              )}
              
              {/* Delete Account Section */}
              <div className="space-y-2 border-t pt-6 mt-6">
                <h3 className="text-lg font-medium flex items-center text-red-600 dark:text-red-400">
                  <Trash2 className="h-5 w-5 mr-2" />
                  Delete Account
                </h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button 
                  variant="destructive" 
                  onClick={() => setDeleteDialogOpen(true)} 
                  className="flex items-center gap-2 mt-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Delete Account</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                This will permanently delete your account and all associated data. 
                This action <span className="font-bold">cannot be undone</span>.
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-100 dark:border-red-800 text-sm">
                <p className="font-medium text-red-800 dark:text-red-300">The following data will be permanently deleted:</p>
                <ul className="list-disc list-inside space-y-1 mt-2 text-red-700 dark:text-red-300">
                  <li>Your user profile and personal information</li>
                  <li>All your saved code snippets</li>
                  <li>Your profile picture</li>
                  <li>All authentication data</li>
                </ul>
              </div>
              <div className="pt-2">
                <Label htmlFor="confirm-delete" className="text-sm font-medium">
                  Type your email to confirm: <span className="font-bold">{userData.email}</span>
                </Label>
                <Input
                  id="confirm-delete"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Enter your email"
                  className="mt-2"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== userData.email || deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}